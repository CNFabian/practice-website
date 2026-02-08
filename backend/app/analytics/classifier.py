"""
Lead Classifier

Classifies users into temperature bands and intent levels based on scores.
"""
from typing import Dict, Any, Tuple
from enum import Enum


class LeadTemperature(Enum):
    """Lead temperature classification"""
    HOT_LEAD = "hot_lead"
    WARM_LEAD = "warm_lead"
    COLD_LEAD = "cold_lead"
    DORMANT = "dormant"


class IntentBand(Enum):
    """User intent classification"""
    VERY_HIGH_INTENT = "very_high_intent"
    HIGH_INTENT = "high_intent"
    MEDIUM_INTENT = "medium_intent"
    LOW_INTENT = "low_intent"


class LeadClassifier:
    """
    Classifies users into temperature and intent categories.
    
    Uses composite score plus dimension-specific indicators for
    intelligent classification.
    """
    
    # Temperature thresholds (based on composite score 0-1000)
    TEMPERATURE_THRESHOLDS = {
        LeadTemperature.HOT_LEAD: 800,      # 800-1000
        LeadTemperature.WARM_LEAD: 500,     # 500-799
        LeadTemperature.COLD_LEAD: 200,     # 200-499
        LeadTemperature.DORMANT: 0,         # 0-199
    }
    
    @staticmethod
    def classify_lead(scores: Dict[str, Any]) -> Dict[str, str]:
        """
        Classify a lead based on their scores.
        
        Args:
            scores: Score dictionary from ScoringEngine.calculate_all_scores()
        
        Returns:
            Dictionary with 'temperature' and 'intent_band' classifications
        """
        composite_score = scores.get("composite_score", 0)
        
        # Get dimension scores
        engagement = scores.get("engagement_score", 0)
        urgency = scores.get("timeline_urgency_score", 0)
        help_seeking = scores.get("help_seeking_score", 0)
        velocity = scores.get("learning_velocity_score", 0)
        rewards = scores.get("rewards_score", 0)
        
        # Classify temperature
        temperature = LeadClassifier._classify_temperature(composite_score)
        
        # Classify intent
        intent_band = LeadClassifier._classify_intent(
            composite_score=composite_score,
            urgency_score=urgency,
            help_seeking_score=help_seeking,
            engagement_score=engagement,
            velocity_score=velocity
        )
        
        return {
            "temperature": temperature.value,
            "intent_band": intent_band.value,
            "temperature_label": LeadClassifier._get_temperature_label(temperature),
            "intent_label": LeadClassifier._get_intent_label(intent_band),
            "classification_reasoning": LeadClassifier._generate_reasoning(
                temperature, intent_band, composite_score, urgency, help_seeking, engagement
            )
        }
    
    @staticmethod
    def _classify_temperature(composite_score: float) -> LeadTemperature:
        """
        Classify lead temperature based on composite score.
        
        Args:
            composite_score: Composite score (0-1000)
        
        Returns:
            LeadTemperature enum
        """
        if composite_score >= LeadClassifier.TEMPERATURE_THRESHOLDS[LeadTemperature.HOT_LEAD]:
            return LeadTemperature.HOT_LEAD
        elif composite_score >= LeadClassifier.TEMPERATURE_THRESHOLDS[LeadTemperature.WARM_LEAD]:
            return LeadTemperature.WARM_LEAD
        elif composite_score >= LeadClassifier.TEMPERATURE_THRESHOLDS[LeadTemperature.COLD_LEAD]:
            return LeadTemperature.COLD_LEAD
        else:
            return LeadTemperature.DORMANT
    
    @staticmethod
    def _classify_intent(
        composite_score: float,
        urgency_score: float,
        help_seeking_score: float,
        engagement_score: float,
        velocity_score: float
    ) -> IntentBand:
        """
        Classify intent band using multi-dimensional analysis.
        
        Intent is not just about composite score, but about behavioral signals:
        - High urgency + high help-seeking = high intent regardless of other scores
        - High engagement + low urgency = medium intent (learning phase)
        - Low everything = low intent
        
        Args:
            composite_score: Overall score (0-1000)
            urgency_score: Timeline urgency (0-100)
            help_seeking_score: Help-seeking behavior (0-100)
            engagement_score: Engagement level (0-100)
            velocity_score: Learning velocity (0-100)
        
        Returns:
            IntentBand enum
        """
        # Very High Intent Indicators
        # Strong urgency + strong help-seeking = ready to act
        if urgency_score >= 80 and help_seeking_score >= 70:
            return IntentBand.VERY_HIGH_INTENT
        
        # High composite with high urgency
        if composite_score >= 750 and urgency_score >= 70:
            return IntentBand.VERY_HIGH_INTENT
        
        # Extremely high help-seeking (wants expert NOW)
        if help_seeking_score >= 85:
            return IntentBand.VERY_HIGH_INTENT
        
        # High Intent Indicators
        # Good urgency + moderate help-seeking
        if urgency_score >= 65 and help_seeking_score >= 50:
            return IntentBand.HIGH_INTENT
        
        # High composite score overall
        if composite_score >= 650:
            return IntentBand.HIGH_INTENT
        
        # Strong help-seeking even without urgency (needs guidance)
        if help_seeking_score >= 70:
            return IntentBand.HIGH_INTENT
        
        # Medium Intent Indicators
        # Moderate urgency with any engagement
        if urgency_score >= 50 and engagement_score >= 40:
            return IntentBand.MEDIUM_INTENT
        
        # Good engagement + velocity (actively learning)
        if engagement_score >= 60 and velocity_score >= 50:
            return IntentBand.MEDIUM_INTENT
        
        # Moderate composite score
        if composite_score >= 400:
            return IntentBand.MEDIUM_INTENT
        
        # Some help-seeking behavior
        if help_seeking_score >= 40:
            return IntentBand.MEDIUM_INTENT
        
        # Low Intent (default)
        # Everything else - just browsing, exploring, or inactive
        return IntentBand.LOW_INTENT
    
    @staticmethod
    def _get_temperature_label(temperature: LeadTemperature) -> str:
        """Get human-readable temperature label"""
        labels = {
            LeadTemperature.HOT_LEAD: "🔥 Hot Lead",
            LeadTemperature.WARM_LEAD: "🌡️ Warm Lead",
            LeadTemperature.COLD_LEAD: "❄️ Cold Lead",
            LeadTemperature.DORMANT: "💤 Dormant",
        }
        return labels.get(temperature, "Unknown")
    
    @staticmethod
    def _get_intent_label(intent: IntentBand) -> str:
        """Get human-readable intent label"""
        labels = {
            IntentBand.VERY_HIGH_INTENT: "🚀 Very High Intent",
            IntentBand.HIGH_INTENT: "⬆️ High Intent",
            IntentBand.MEDIUM_INTENT: "➡️ Medium Intent",
            IntentBand.LOW_INTENT: "⬇️ Low Intent",
        }
        return labels.get(intent, "Unknown")
    
    @staticmethod
    def _generate_reasoning(
        temperature: LeadTemperature,
        intent: IntentBand,
        composite_score: float,
        urgency: float,
        help_seeking: float,
        engagement: float
    ) -> str:
        """
        Generate human-readable reasoning for classification.
        
        Args:
            temperature: Temperature classification
            intent: Intent classification
            composite_score: Composite score
            urgency: Urgency score
            help_seeking: Help-seeking score
            engagement: Engagement score
        
        Returns:
            String explaining the classification
        """
        reasons = []
        
        # Temperature reasoning
        if temperature == LeadTemperature.HOT_LEAD:
            reasons.append(f"High composite score ({composite_score:.0f}/1000)")
        elif temperature == LeadTemperature.WARM_LEAD:
            reasons.append(f"Moderate composite score ({composite_score:.0f}/1000)")
        elif temperature == LeadTemperature.COLD_LEAD:
            reasons.append(f"Low composite score ({composite_score:.0f}/1000)")
        else:
            reasons.append(f"Very low activity ({composite_score:.0f}/1000)")
        
        # Intent reasoning
        if intent == IntentBand.VERY_HIGH_INTENT:
            if urgency >= 80:
                reasons.append(f"Very high urgency ({urgency:.0f}/100)")
            if help_seeking >= 70:
                reasons.append(f"Strong help-seeking behavior ({help_seeking:.0f}/100)")
        
        elif intent == IntentBand.HIGH_INTENT:
            if urgency >= 65:
                reasons.append(f"High urgency timeline ({urgency:.0f}/100)")
            if help_seeking >= 50:
                reasons.append(f"Active help-seeking ({help_seeking:.0f}/100)")
        
        elif intent == IntentBand.MEDIUM_INTENT:
            if engagement >= 60:
                reasons.append(f"Good engagement level ({engagement:.0f}/100)")
            if urgency >= 50:
                reasons.append(f"Moderate urgency ({urgency:.0f}/100)")
        
        else:
            reasons.append("Limited engagement signals")
        
        return "; ".join(reasons)
    
    @staticmethod
    def get_recommended_actions(classification: Dict[str, str]) -> Dict[str, Any]:
        """
        Get recommended actions based on classification.
        
        Args:
            classification: Result from classify_lead()
        
        Returns:
            Dictionary with recommended actions
        """
        temperature = classification.get("temperature")
        intent = classification.get("intent_band")
        
        actions = {
            "priority_level": "low",
            "recommended_outreach": [],
            "nurture_strategy": "",
            "next_steps": []
        }
        
        # Hot leads
        if temperature == LeadTemperature.HOT_LEAD.value:
            actions["priority_level"] = "critical"
            actions["recommended_outreach"] = [
                "Immediate personal outreach",
                "Expert consultation offer",
                "Premium resource access"
            ]
            
            if intent == IntentBand.VERY_HIGH_INTENT.value:
                actions["nurture_strategy"] = "Direct sales engagement - user is ready to act"
                actions["next_steps"] = [
                    "Schedule consultation within 24 hours",
                    "Provide personalized home buying plan",
                    "Connect with local realtor/loan officer"
                ]
            else:
                actions["nurture_strategy"] = "Accelerate to conversion"
                actions["next_steps"] = [
                    "Offer free consultation",
                    "Send advanced resources",
                    "Invite to exclusive webinar"
                ]
        
        # Warm leads
        elif temperature == LeadTemperature.WARM_LEAD.value:
            actions["priority_level"] = "high"
            actions["recommended_outreach"] = [
                "Automated personalized email",
                "Resource recommendations",
                "Success stories"
            ]
            
            if intent in [IntentBand.VERY_HIGH_INTENT.value, IntentBand.HIGH_INTENT.value]:
                actions["nurture_strategy"] = "Active nurturing with personal touch"
                actions["next_steps"] = [
                    "Send targeted content based on timeline",
                    "Offer group consultation",
                    "Provide market insights for their area"
                ]
            else:
                actions["nurture_strategy"] = "Educational content drip campaign"
                actions["next_steps"] = [
                    "Continue educational content",
                    "Highlight success stories",
                    "Encourage calculator usage"
                ]
        
        # Cold leads
        elif temperature == LeadTemperature.COLD_LEAD.value:
            actions["priority_level"] = "medium"
            actions["recommended_outreach"] = [
                "Automated educational content",
                "General newsletter",
                "Community engagement"
            ]
            actions["nurture_strategy"] = "Long-term educational nurturing"
            actions["next_steps"] = [
                "Weekly educational emails",
                "Gamification encouragement",
                "Re-engagement campaigns"
            ]
        
        # Dormant
        else:
            actions["priority_level"] = "low"
            actions["recommended_outreach"] = [
                "Re-engagement campaign",
                "Special offer to return",
                "Survey to understand barriers"
            ]
            actions["nurture_strategy"] = "Win-back campaign"
            actions["next_steps"] = [
                "Send 'we miss you' email",
                "Offer bonus coins/rewards",
                "Survey to understand drop-off"
            ]
        
        return actions
    
    @staticmethod
    def classify_and_recommend(scores: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete classification with recommendations.
        
        Args:
            scores: Score dictionary from ScoringEngine
        
        Returns:
            Complete classification with actions
        """
        classification = LeadClassifier.classify_lead(scores)
        actions = LeadClassifier.get_recommended_actions(classification)
        
        return {
            **classification,
            "recommended_actions": actions,
            "scores_summary": {
                "composite_score": scores.get("composite_score", 0),
                "engagement_score": scores.get("engagement_score", 0),
                "urgency_score": scores.get("timeline_urgency_score", 0),
                "help_seeking_score": scores.get("help_seeking_score", 0),
                "profile_completion": scores.get("profile_completion_pct", 0)
            }
        }


class BulkClassifier:
    """Helper class for bulk classification operations"""
    
    @staticmethod
    def classify_multiple(scores_list: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        """
        Classify multiple users at once.
        
        Args:
            scores_list: List of score dictionaries
        
        Returns:
            List of classifications
        """
        return [
            LeadClassifier.classify_and_recommend(scores)
            for scores in scores_list
        ]
    
    @staticmethod
    def get_distribution(classifications: list[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get distribution statistics for a set of classifications.
        
        Args:
            classifications: List of classification results
        
        Returns:
            Distribution statistics
        """
        temp_counts = {
            LeadTemperature.HOT_LEAD.value: 0,
            LeadTemperature.WARM_LEAD.value: 0,
            LeadTemperature.COLD_LEAD.value: 0,
            LeadTemperature.DORMANT.value: 0,
        }
        
        intent_counts = {
            IntentBand.VERY_HIGH_INTENT.value: 0,
            IntentBand.HIGH_INTENT.value: 0,
            IntentBand.MEDIUM_INTENT.value: 0,
            IntentBand.LOW_INTENT.value: 0,
        }
        
        for classification in classifications:
            temp = classification.get("temperature")
            intent = classification.get("intent_band")
            
            if temp in temp_counts:
                temp_counts[temp] += 1
            if intent in intent_counts:
                intent_counts[intent] += 1
        
        total = len(classifications)
        
        return {
            "total_leads": total,
            "temperature_distribution": {
                temp: {
                    "count": count,
                    "percentage": round((count / total * 100) if total > 0 else 0, 2)
                }
                for temp, count in temp_counts.items()
            },
            "intent_distribution": {
                intent: {
                    "count": count,
                    "percentage": round((count / total * 100) if total > 0 else 0, 2)
                }
                for intent, count in intent_counts.items()
            },
            "high_priority_leads": temp_counts[LeadTemperature.HOT_LEAD.value],
            "actionable_leads": (
                temp_counts[LeadTemperature.HOT_LEAD.value] +
                temp_counts[LeadTemperature.WARM_LEAD.value]
            )
        }
