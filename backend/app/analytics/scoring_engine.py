"""
Scoring Engine

Main engine for calculating lead scores with partial data handling.
Normalizes scores based on available signals only.
"""
from typing import Dict, Any, List, Tuple, Optional
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from analytics.scoring_signals import ScoringSignalsCatalog, ScoreDimension, ScoringSignal
from analytics.signal_extractors import SignalExtractor
from analytics.scoring_signals import SignalAvailabilityChecker
from analytics.classifier import LeadClassifier


class ScoringEngine:
    """
    Main scoring engine with partial data handling.
    
    Calculates scores using only available signals, preventing penalties
    for missing optional data.
    """
    
    # Dimension weights for composite score
    DIMENSION_WEIGHTS = {
        ScoreDimension.ENGAGEMENT: 0.35,
        ScoreDimension.TIMELINE_URGENCY: 0.15,
        ScoreDimension.HELP_SEEKING: 0.15,
        ScoreDimension.LEARNING_VELOCITY: 0.25,
        ScoreDimension.REWARDS: 0.25,
    }
    
    def __init__(self, db: Session, user_id: UUID):
        self.db = db
        self.user_id = user_id
        self.extractor = SignalExtractor(db, user_id)
        self.availability_checker = SignalAvailabilityChecker(db, user_id)
    
    def calculate_all_scores(self) -> Dict[str, Any]:
        """
        Calculate all scoring dimensions and composite score.
        
        Returns:
            Dictionary with all scores, classifications, and metadata
        """
        # Calculate individual dimension scores
        engagement_result = self.calculate_dimension_score(ScoreDimension.ENGAGEMENT)
        urgency_result = self.calculate_dimension_score(ScoreDimension.TIMELINE_URGENCY)
        help_seeking_result = self.calculate_dimension_score(ScoreDimension.HELP_SEEKING)
        velocity_result = self.calculate_dimension_score(ScoreDimension.LEARNING_VELOCITY)
        rewards_result = self.calculate_dimension_score(ScoreDimension.REWARDS)
        
        # Calculate composite score (weighted average of available dimensions)
        composite_score = self._calculate_composite_score([
            (ScoreDimension.ENGAGEMENT, engagement_result),
            (ScoreDimension.TIMELINE_URGENCY, urgency_result),
            (ScoreDimension.HELP_SEEKING, help_seeking_result),
            (ScoreDimension.LEARNING_VELOCITY, velocity_result),
            (ScoreDimension.REWARDS, rewards_result),
        ])
        
        # Get profile completion
        availability_summary = self.availability_checker.get_availability_summary()
        
        return {
            "user_id": str(self.user_id),
            "calculated_at": datetime.now().isoformat(),
            
            # Dimension scores (0-100 each)
            "engagement_score": engagement_result["score"],
            "timeline_urgency_score": urgency_result["score"],
            "help_seeking_score": help_seeking_result["score"],
            "learning_velocity_score": velocity_result["score"],
            "rewards_score": rewards_result["score"],
            
            # Composite score (0-1000)
            "composite_score": composite_score,
            
            # Profile completion
            "profile_completion_pct": availability_summary["completion_percentage"],
            "available_signals_count": availability_summary["available_signals_count"],
            "total_signals_count": availability_summary["total_signals_count"],
            
            # Detailed breakdown
            "dimension_details": {
                "engagement": engagement_result,
                "timeline_urgency": urgency_result,
                "help_seeking": help_seeking_result,
                "learning_velocity": velocity_result,
                "rewards": rewards_result,
            },
            
            # Availability by dimension
            "availability_by_dimension": availability_summary["by_dimension"]
        }
    
    def calculate_dimension_score(self, dimension: ScoreDimension) -> Dict[str, Any]:
        """
        Calculate score for a single dimension using only available signals.
        
        Args:
            dimension: The dimension to calculate
        
        Returns:
            Dictionary with score, available signals, and details
        """
        # Get all signals for this dimension
        signals = ScoringSignalsCatalog.get_signals_by_dimension(dimension)
        
        # Extract values for available signals only
        signal_values = []
        total_weight = 0.0
        weighted_sum = 0.0
        
        for signal in signals:
            # Check if signal is available
            if not self.availability_checker.check_signal_availability(signal):
                continue
            
            # Extract the value
            value = self._extract_signal_value(signal)
            
            if value is not None:
                signal_values.append({
                    "signal_id": signal.signal_id,
                    "signal_name": signal.name,
                    "value": value,
                    "weight": signal.weight
                })
                
                # Weighted average calculation
                weighted_sum += value * signal.weight
                total_weight += signal.weight
        
        # Calculate normalized score (0-100)
        if total_weight > 0:
            score = weighted_sum / total_weight
        else:
            score = 0.0
        
        return {
            "score": round(float(score), 2),
            "available_signals": len(signal_values),
            "total_signals": len(signals),
            "completion_pct": round((len(signal_values) / len(signals) * 100) if signals else 0, 2),
            "signal_values": signal_values
        }
    
    def _extract_signal_value(self, signal: ScoringSignal) -> Optional[float]:
        """
        Extract the actual value for a signal.
        
        Args:
            signal: The signal to extract
        
        Returns:
            Float value (0-100) or None if not available
        """
        # Get the extraction method from SignalExtractor
        method_name = signal.extraction_func
        
        if hasattr(self.extractor, method_name):
            method = getattr(self.extractor, method_name)
            try:
                return method()
            except Exception as e:
                # Log error but don't fail entire scoring
                print(f"Error extracting signal {signal.signal_id}: {e}")
                return None
        else:
            print(f"Warning: Extraction method {method_name} not found")
            return None
    
    def _calculate_composite_score(
        self, 
        dimension_results: List[Tuple[ScoreDimension, Dict[str, Any]]]
    ) -> float:
        """
        Calculate composite score from dimension scores.
        
        Uses only available dimensions and re-normalizes weights.
        
        Args:
            dimension_results: List of (dimension, result_dict) tuples
        
        Returns:
            Composite score (0-1000 scale)
        """
        weighted_sum = 0.0
        total_weight = 0.0
        
        for dimension, result in dimension_results:
            score = result["score"]
            
            # Only include dimensions with available data
            if result["available_signals"] > 0:
                weight = self.DIMENSION_WEIGHTS.get(dimension, 0.0)
                weighted_sum += score * weight
                total_weight += weight
        
        # Calculate weighted average
        if total_weight > 0:
            normalized_score = weighted_sum / total_weight
        else:
            normalized_score = 0.0
        
        # Scale to 0-1000
        composite_score = normalized_score * 10
        
        return round(float(composite_score), 2)
    
    def calculate_with_classification(self) -> Dict[str, Any]:
        """
        Calculate scores and apply classification in one call.
        
        Returns:
            Complete dictionary with scores, classifications, and recommendations
        """
        scores = self.calculate_all_scores()
        classification = LeadClassifier.classify_and_recommend(scores)
        
        return {
            **scores,
            "classification": classification
        }
    
    def get_score_explanation(self) -> str:
        """
        Generate human-readable explanation of the score.
        
        Returns:
            String explanation
        """
        scores = self.calculate_all_scores()
        
        composite = scores["composite_score"]
        completion = scores["profile_completion_pct"]
        
        # Generate explanation
        explanation = f"Composite Lead Score: {composite}/1000\n"
        explanation += f"Profile Completion: {completion}%\n\n"
        
        explanation += "Score Breakdown:\n"
        explanation += f"  - Engagement: {scores['engagement_score']}/100 "
        explanation += f"({scores['dimension_details']['engagement']['available_signals']}/{scores['dimension_details']['engagement']['total_signals']} signals)\n"
        
        explanation += f"  - Timeline Urgency: {scores['timeline_urgency_score']}/100 "
        explanation += f"({scores['dimension_details']['timeline_urgency']['available_signals']}/{scores['dimension_details']['timeline_urgency']['total_signals']} signals)\n"
        
        explanation += f"  - Help-Seeking: {scores['help_seeking_score']}/100 "
        explanation += f"({scores['dimension_details']['help_seeking']['available_signals']}/{scores['dimension_details']['help_seeking']['total_signals']} signals)\n"
        
        explanation += f"  - Learning Velocity: {scores['learning_velocity_score']}/100 "
        explanation += f"({scores['dimension_details']['learning_velocity']['available_signals']}/{scores['dimension_details']['learning_velocity']['total_signals']} signals)\n"
        
        explanation += f"  - Rewards: {scores['rewards_score']}/100 "
        explanation += f"({scores['dimension_details']['rewards']['available_signals']}/{scores['dimension_details']['rewards']['total_signals']} signals)\n"
        
        return explanation


class BatchScoringEngine:
    """
    Batch scoring engine for recalculating multiple users.
    Optimized for performance.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_scores_for_users(
        self, 
        user_ids: List[UUID],
        update_database: bool = True
    ) -> Dict[UUID, Dict[str, Any]]:
        """
        Calculate scores for multiple users.
        
        Args:
            user_ids: List of user IDs to score
            update_database: Whether to save to database
        
        Returns:
            Dictionary mapping user_id to score results
        """
        results = {}
        
        for user_id in user_ids:
            try:
                engine = ScoringEngine(self.db, user_id)
                scores = engine.calculate_all_scores()
                results[user_id] = scores
                
                if update_database:
                    self._save_scores_to_db(user_id, scores)
                    
            except Exception as e:
                print(f"Error scoring user {user_id}: {e}")
                results[user_id] = {"error": str(e)}
        
        return results
    
    def calculate_all_users(self, update_database: bool = True) -> Dict[str, Any]:
        """
        Calculate scores for all users in the system.
        
        Args:
            update_database: Whether to save to database
        
        Returns:
            Summary of batch scoring operation
        """
        from models import User
        
        # Get all user IDs
        user_ids = [u.id for u in self.db.query(User.id).all()]
        
        print(f"Scoring {len(user_ids)} users...")
        
        results = self.calculate_scores_for_users(user_ids, update_database)
        
        # Generate summary
        successful = sum(1 for r in results.values() if "error" not in r)
        failed = len(results) - successful
        
        return {
            "total_users": len(user_ids),
            "successful": successful,
            "failed": failed,
            "results": results
        }
    
    def _save_scores_to_db(self, user_id: UUID, scores: Dict[str, Any]):
        """
        Save calculated scores to database.
        
        Args:
            user_id: User ID
            scores: Score results dictionary
        """
        from models import UserLeadScore
        
        # Get or create lead score record
        lead_score = self.db.query(UserLeadScore).filter(
            UserLeadScore.user_id == user_id
        ).first()
        
        if not lead_score:
            lead_score = UserLeadScore(user_id=user_id)
            self.db.add(lead_score)
        
        # Update scores
        lead_score.engagement_score = Decimal(str(scores["engagement_score"]))
        lead_score.timeline_urgency_score = Decimal(str(scores["timeline_urgency_score"]))
        lead_score.help_seeking_score = Decimal(str(scores["help_seeking_score"]))
        lead_score.learning_velocity_score = Decimal(str(scores["learning_velocity_score"]))
        lead_score.rewards_score = Decimal(str(scores["rewards_score"]))
        lead_score.composite_score = Decimal(str(scores["composite_score"]))
        lead_score.profile_completion_pct = Decimal(str(scores["profile_completion_pct"]))
        lead_score.available_signals_count = scores["available_signals_count"]
        lead_score.total_signals_count = scores["total_signals_count"]
        
        # Apply classification
        classification = LeadClassifier.classify_lead(scores)
        lead_score.lead_temperature = classification["temperature"]
        lead_score.intent_band = classification["intent_band"]
        
        # Update timestamps
        lead_score.last_calculated_at = datetime.now(timezone.utc)
        lead_score.last_activity_at = datetime.now(timezone.utc)
        lead_score.updated_at = datetime.now(timezone.utc)
        
        self.db.commit()
