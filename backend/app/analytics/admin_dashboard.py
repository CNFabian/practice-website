"""
Analytics Dashboard for Admin Interface

Custom dashboard page showing lead analytics, distributions, and insights.
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from models import UserLeadScore, UserBehaviorEvent, User, UserModuleProgress, UserLessonProgress
from analytics.classifier import BulkClassifier


class AnalyticsDashboard:
    """Analytics dashboard data provider"""
    
    @staticmethod
    def get_dashboard_data(db: Session) -> Dict[str, Any]:
        """
        Get comprehensive dashboard data for admin view.
        
        Returns:
            Dictionary with all dashboard metrics and charts
        """
        # Get all lead scores
        lead_scores = db.query(UserLeadScore).all()
        total_users = db.query(User).count()
        
        if not lead_scores:
            return AnalyticsDashboard._empty_dashboard(total_users)
        
        # Calculate distributions
        temp_dist = AnalyticsDashboard._calculate_temperature_distribution(lead_scores)
        intent_dist = AnalyticsDashboard._calculate_intent_distribution(lead_scores)
        
        # Calculate averages
        total_score = sum(float(s.composite_score) for s in lead_scores)
        total_completion = sum(float(s.profile_completion_pct) for s in lead_scores)
        avg_score = total_score / len(lead_scores)
        avg_completion = total_completion / len(lead_scores)
        
        # Get recent high-value events
        recent_events = AnalyticsDashboard._get_recent_high_value_events(db, limit=10)
        
        # Get top performers
        top_leads = AnalyticsDashboard._get_top_leads(db, limit=10)
        
        # Get engagement metrics
        engagement_metrics = AnalyticsDashboard._calculate_engagement_metrics(db)
        
        return {
            "overview": {
                "total_users": total_users,
                "scored_users": len(lead_scores),
                "unscored_users": total_users - len(lead_scores),
                "average_composite_score": round(avg_score, 2),
                "average_profile_completion": round(avg_completion, 2)
            },
            "temperature_distribution": temp_dist,
            "intent_distribution": intent_dist,
            "priority_leads": {
                "hot_leads": temp_dist.get("hot_lead", {}).get("count", 0),
                "warm_leads": temp_dist.get("warm_lead", {}).get("count", 0),
                "actionable_leads": (
                    temp_dist.get("hot_lead", {}).get("count", 0) +
                    temp_dist.get("warm_lead", {}).get("count", 0)
                )
            },
            "recent_high_value_events": recent_events,
            "top_leads": top_leads,
            "engagement_metrics": engagement_metrics
        }
    
    @staticmethod
    def _empty_dashboard(total_users: int) -> Dict[str, Any]:
        """Return empty dashboard when no scores exist"""
        return {
            "overview": {
                "total_users": total_users,
                "scored_users": 0,
                "unscored_users": total_users,
                "average_composite_score": 0.0,
                "average_profile_completion": 0.0
            },
            "temperature_distribution": {},
            "intent_distribution": {},
            "priority_leads": {
                "hot_leads": 0,
                "warm_leads": 0,
                "actionable_leads": 0
            },
            "recent_high_value_events": [],
            "top_leads": [],
            "engagement_metrics": {}
        }
    
    @staticmethod
    def _calculate_temperature_distribution(lead_scores: list) -> Dict[str, Any]:
        """Calculate temperature distribution"""
        temp_counts = {
            "hot_lead": 0,
            "warm_lead": 0,
            "cold_lead": 0,
            "dormant": 0
        }
        
        for score in lead_scores:
            temp = score.lead_temperature
            if temp in temp_counts:
                temp_counts[temp] += 1
        
        total = len(lead_scores)
        
        return {
            temp: {
                "count": count,
                "percentage": round((count / total * 100), 2),
                "label": {
                    "hot_lead": "🔥 Hot Lead",
                    "warm_lead": "🌡️ Warm Lead",
                    "cold_lead": "❄️ Cold Lead",
                    "dormant": "💤 Dormant"
                }.get(temp, temp)
            }
            for temp, count in temp_counts.items()
        }
    
    @staticmethod
    def _calculate_intent_distribution(lead_scores: list) -> Dict[str, Any]:
        """Calculate intent distribution"""
        intent_counts = {
            "very_high_intent": 0,
            "high_intent": 0,
            "medium_intent": 0,
            "low_intent": 0
        }
        
        for score in lead_scores:
            intent = score.intent_band
            if intent in intent_counts:
                intent_counts[intent] += 1
        
        total = len(lead_scores)
        
        return {
            intent: {
                "count": count,
                "percentage": round((count / total * 100), 2),
                "label": {
                    "very_high_intent": "🚀 Very High Intent",
                    "high_intent": "⬆️ High Intent",
                    "medium_intent": "➡️ Medium Intent",
                    "low_intent": "⬇️ Low Intent"
                }.get(intent, intent)
            }
            for intent, count in intent_counts.items()
        }
    
    @staticmethod
    def _get_recent_high_value_events(db: Session, limit: int = 10) -> list:
        """Get recent high-value events (weight >= 5.0)"""
        from sqlalchemy import desc
        
        events = db.query(UserBehaviorEvent, User).join(
            User, UserBehaviorEvent.user_id == User.id
        ).filter(
            UserBehaviorEvent.event_weight >= 5.0
        ).order_by(desc(UserBehaviorEvent.created_at)).limit(limit).all()
        
        return [
            {
                "user_email": user.email,
                "user_name": f"{user.first_name} {user.last_name}",
                "event_type": event.event_type,
                "event_category": event.event_category,
                "event_weight": float(event.event_weight) if event.event_weight else 0,
                "created_at": event.created_at.isoformat()
            }
            for event, user in events
        ]
    
    @staticmethod
    def _get_top_leads(db: Session, limit: int = 10) -> list:
        """Get top leads by composite score"""
        from sqlalchemy import desc
        
        top_scores = db.query(UserLeadScore, User).join(
            User, UserLeadScore.user_id == User.id
        ).order_by(desc(UserLeadScore.composite_score)).limit(limit).all()
        
        return [
            {
                "user_id": str(user.id),
                "user_email": user.email,
                "user_name": f"{user.first_name} {user.last_name}",
                "composite_score": float(score.composite_score),
                "temperature": score.lead_temperature,
                "intent": score.intent_band,
                "profile_completion": float(score.profile_completion_pct)
            }
            for score, user in top_scores
        ]
    
    @staticmethod
    def _calculate_engagement_metrics(db: Session) -> Dict[str, Any]:
        """Calculate overall engagement metrics"""
        # Total lessons and modules completed across all users
        total_lessons_completed = db.query(UserLessonProgress).filter(
            UserLessonProgress.status == 'completed'
        ).count()
        
        total_modules_completed = db.query(UserModuleProgress).filter(
            UserModuleProgress.status == 'completed'
        ).count()
        
        # Total behavior events
        total_events = db.query(UserBehaviorEvent).count()
        
        # Events by category
        events_by_category = db.query(
            UserBehaviorEvent.event_category,
            func.count(UserBehaviorEvent.id)
        ).group_by(UserBehaviorEvent.event_category).all()
        
        category_counts = {
            category: count for category, count in events_by_category
        }
        
        return {
            "total_lessons_completed": total_lessons_completed,
            "total_modules_completed": total_modules_completed,
            "total_behavior_events": total_events,
            "events_by_category": category_counts
        }
