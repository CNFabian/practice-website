from datetime import datetime
from typing import List, Optional
from uuid import UUID
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from database import get_db
from auth import get_current_user
from models import (
    User, RewardCoupon, UserCouponRedemption, UserCoinBalance
)
from schemas import (
    RewardCouponResponse, CouponRedemption, UserCouponRedemptionResponse,
    SuccessResponse
)
from utils import CoinManager, NotificationManager
from analytics.event_tracker import EventTracker

router = APIRouter()


@router.get("/coupons", response_model=List[RewardCouponResponse])
def get_available_coupons(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    min_coins: Optional[int] = None,
    max_coins: Optional[int] = None
):
    """Get all available reward coupons"""
    query = db.query(RewardCoupon).filter(
        and_(
            RewardCoupon.is_active == True,
            RewardCoupon.expires_at > datetime.now()
        )
    )
    
    # Filter by category if provided
    if category:
        query = query.filter(RewardCoupon.partner_company.ilike(f"%{category}%"))
    
    # Filter by coin cost range
    if min_coins is not None:
        query = query.filter(RewardCoupon.cost_in_coins >= min_coins)
    if max_coins is not None:
        query = query.filter(RewardCoupon.cost_in_coins <= max_coins)
    
    coupons = query.order_by(RewardCoupon.cost_in_coins).all()
    
    # Filter out coupons that have reached max redemptions
    available_coupons = []
    for coupon in coupons:
        if coupon.max_redemptions is None or coupon.current_redemptions < coupon.max_redemptions:
            available_coupons.append(coupon)
    
    return [
        RewardCouponResponse(
            id=coupon.id,
            title=coupon.title,
            description=coupon.description,
            partner_company=coupon.partner_company,
            cost_in_coins=coupon.cost_in_coins,
            max_redemptions=coupon.max_redemptions,
            current_redemptions=coupon.current_redemptions,
            expires_at=coupon.expires_at,
            image_url=coupon.image_url,
            terms_conditions=coupon.terms_conditions,
            is_active=coupon.is_active
        )
        for coupon in available_coupons
    ]


@router.get("/coupons/{coupon_id}", response_model=RewardCouponResponse)
def get_coupon_details(
    coupon_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific coupon"""
    coupon = db.query(RewardCoupon).filter(
        and_(
            RewardCoupon.id == coupon_id,
            RewardCoupon.is_active == True
        )
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    if coupon.expires_at and coupon.expires_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon has expired"
        )
    
    return RewardCouponResponse(
        id=coupon.id,
        title=coupon.title,
        description=coupon.description,
        partner_company=coupon.partner_company,
        cost_in_coins=coupon.cost_in_coins,
        max_redemptions=coupon.max_redemptions,
        current_redemptions=coupon.current_redemptions,
        expires_at=coupon.expires_at,
        image_url=coupon.image_url,
        terms_conditions=coupon.terms_conditions,
        is_active=coupon.is_active
    )


@router.post("/redeem", response_model=UserCouponRedemptionResponse)
def redeem_coupon(
    redemption_data: CouponRedemption,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Redeem a coupon using coins"""
    # Get coupon details
    coupon = db.query(RewardCoupon).filter(
        and_(
            RewardCoupon.id == redemption_data.coupon_id,
            RewardCoupon.is_active == True
        )
    ).first()
    
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    
    # Check if coupon is still valid
    if coupon.expires_at and coupon.expires_at <= datetime.now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon has expired"
        )
    
    # Check if max redemptions reached
    if coupon.max_redemptions and coupon.current_redemptions >= coupon.max_redemptions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon redemption limit reached"
        )
    
    # Get user's coin balance
    coin_balance = CoinManager.get_or_create_coin_balance(db, current_user.id)
    
    # Check if user has enough coins
    if coin_balance.current_balance < coupon.cost_in_coins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient coins. You need {coupon.cost_in_coins} coins but have {coin_balance.current_balance}"
        )
    
    # Generate unique redemption code
    redemption_code = _generate_redemption_code()
    
    # Ensure redemption code is unique
    while db.query(UserCouponRedemption).filter(
        UserCouponRedemption.redemption_code == redemption_code
    ).first():
        redemption_code = _generate_redemption_code()
    
    # Create redemption record
    redemption = UserCouponRedemption(
        user_id=current_user.id,
        coupon_id=coupon.id,
        redemption_code=redemption_code,
        coins_spent=coupon.cost_in_coins,
        expires_at=coupon.expires_at
    )
    
    db.add(redemption)
    
    # Spend coins
    try:
        CoinManager.spend_coins(
            db,
            current_user.id,
            coupon.cost_in_coins,
            "coupon_redemption",
            redemption.id,
            f"Redeemed coupon: {coupon.title}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Update coupon redemption count
    coupon.current_redemptions += 1
    
    db.commit()
    db.refresh(redemption)
    
    # Track coupon redemption event
    EventTracker.track_coupon_redeemed(
        db, current_user.id, coupon.id, coupon.title, coupon.cost_in_coins
    )
    
    # Send success notification
    NotificationManager.create_notification(
        db,
        current_user.id,
        "coupon_redeemed",
        "Coupon Redeemed Successfully!",
        f"You've successfully redeemed {coupon.title}. Your redemption code is: {redemption_code}",
        "high"
    )
    
    return UserCouponRedemptionResponse(
        id=redemption.id,
        coupon=RewardCouponResponse(
            id=coupon.id,
            title=coupon.title,
            description=coupon.description,
            partner_company=coupon.partner_company,
            cost_in_coins=coupon.cost_in_coins,
            max_redemptions=coupon.max_redemptions,
            current_redemptions=coupon.current_redemptions,
            expires_at=coupon.expires_at,
            image_url=coupon.image_url,
            terms_conditions=coupon.terms_conditions,
            is_active=coupon.is_active
        ),
        redemption_code=redemption.redemption_code,
        coins_spent=redemption.coins_spent,
        redeemed_at=redemption.redeemed_at,
        expires_at=redemption.expires_at,
        is_active=redemption.is_active
    )


@router.get("/my-redemptions", response_model=List[UserCouponRedemptionResponse])
def get_user_redemptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
    active_only: bool = False
):
    """Get user's coupon redemption history"""
    query = db.query(UserCouponRedemption).join(RewardCoupon).filter(
        UserCouponRedemption.user_id == current_user.id
    )
    
    if active_only:
        query = query.filter(
            and_(
                UserCouponRedemption.is_active == True,
                UserCouponRedemption.expires_at > datetime.now()
            )
        )
    
    redemptions = query.order_by(
        desc(UserCouponRedemption.redeemed_at)
    ).offset(offset).limit(limit).all()
    
    return [
        UserCouponRedemptionResponse(
            id=redemption.id,
            coupon=RewardCouponResponse(
                id=redemption.coupon.id,
                title=redemption.coupon.title,
                description=redemption.coupon.description,
                partner_company=redemption.coupon.partner_company,
                cost_in_coins=redemption.coupon.cost_in_coins,
                max_redemptions=redemption.coupon.max_redemptions,
                current_redemptions=redemption.coupon.current_redemptions,
                expires_at=redemption.coupon.expires_at,
                image_url=redemption.coupon.image_url,
                terms_conditions=redemption.coupon.terms_conditions,
                is_active=redemption.coupon.is_active
            ),
            redemption_code=redemption.redemption_code,
            coins_spent=redemption.coins_spent,
            redeemed_at=redemption.redeemed_at,
            expires_at=redemption.expires_at,
            is_active=redemption.is_active
        )
        for redemption in redemptions
    ]


@router.get("/redemption/{redemption_id}", response_model=UserCouponRedemptionResponse)
def get_redemption_details(
    redemption_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific redemption"""
    redemption = db.query(UserCouponRedemption).join(RewardCoupon).filter(
        and_(
            UserCouponRedemption.id == redemption_id,
            UserCouponRedemption.user_id == current_user.id
        )
    ).first()
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption not found"
        )
    
    return UserCouponRedemptionResponse(
        id=redemption.id,
        coupon=RewardCouponResponse(
            id=redemption.coupon.id,
            title=redemption.coupon.title,
            description=redemption.coupon.description,
            partner_company=redemption.coupon.partner_company,
            cost_in_coins=redemption.coupon.cost_in_coins,
            max_redemptions=redemption.coupon.max_redemptions,
            current_redemptions=redemption.coupon.current_redemptions,
            expires_at=redemption.coupon.expires_at,
            image_url=redemption.coupon.image_url,
            terms_conditions=redemption.coupon.terms_conditions,
            is_active=redemption.coupon.is_active
        ),
        redemption_code=redemption.redemption_code,
        coins_spent=redemption.coins_spent,
        redeemed_at=redemption.redeemed_at,
        expires_at=redemption.expires_at,
        is_active=redemption.is_active
    )


@router.post("/redemption/{redemption_id}/use", response_model=SuccessResponse)
def mark_redemption_used(
    redemption_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a redemption as used"""
    redemption = db.query(UserCouponRedemption).filter(
        and_(
            UserCouponRedemption.id == redemption_id,
            UserCouponRedemption.user_id == current_user.id,
            UserCouponRedemption.is_active == True
        )
    ).first()
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active redemption not found"
        )
    
    if redemption.used_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Redemption already marked as used"
        )
    
    redemption.used_at = datetime.now()
    db.commit()
    
    return SuccessResponse(message="Redemption marked as used successfully")


@router.get("/categories")
def get_reward_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get available reward categories"""
    # Get unique partner companies as categories
    categories = db.query(RewardCoupon.partner_company).filter(
        and_(
            RewardCoupon.is_active == True,
            RewardCoupon.partner_company.isnot(None)
        )
    ).distinct().all()
    
    category_list = [cat[0] for cat in categories if cat[0]]
    
    # Get coin cost ranges
    min_cost = db.query(db.func.min(RewardCoupon.cost_in_coins)).filter(
        RewardCoupon.is_active == True
    ).scalar() or 0
    
    max_cost = db.query(db.func.max(RewardCoupon.cost_in_coins)).filter(
        RewardCoupon.is_active == True
    ).scalar() or 1000
    
    return {
        "categories": category_list,
        "coin_range": {
            "min": min_cost,
            "max": max_cost
        },
        "popular_ranges": [
            {"label": "Under 100 coins", "min": 0, "max": 100},
            {"label": "100-500 coins", "min": 100, "max": 500},
            {"label": "500-1000 coins", "min": 500, "max": 1000},
            {"label": "1000+ coins", "min": 1000, "max": None}
        ]
    }


@router.get("/statistics")
def get_reward_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's reward redemption statistics"""
    # Total redemptions
    total_redemptions = db.query(UserCouponRedemption).filter(
        UserCouponRedemption.user_id == current_user.id
    ).count()
    
    # Active redemptions
    active_redemptions = db.query(UserCouponRedemption).filter(
        and_(
            UserCouponRedemption.user_id == current_user.id,
            UserCouponRedemption.is_active == True,
            UserCouponRedemption.expires_at > datetime.now()
        )
    ).count()
    
    # Used redemptions
    used_redemptions = db.query(UserCouponRedemption).filter(
        and_(
            UserCouponRedemption.user_id == current_user.id,
            UserCouponRedemption.used_at.isnot(None)
        )
    ).count()
    
    # Total coins spent
    total_coins_spent = db.query(
        db.func.sum(UserCouponRedemption.coins_spent)
    ).filter(
        UserCouponRedemption.user_id == current_user.id
    ).scalar() or 0
    
    # Favorite categories
    favorite_categories = db.query(
        RewardCoupon.partner_company,
        db.func.count(UserCouponRedemption.id).label('count')
    ).join(UserCouponRedemption).filter(
        UserCouponRedemption.user_id == current_user.id
    ).group_by(
        RewardCoupon.partner_company
    ).order_by(
        desc('count')
    ).limit(5).all()
    
    return {
        "total_redemptions": total_redemptions,
        "active_redemptions": active_redemptions,
        "used_redemptions": used_redemptions,
        "total_coins_spent": total_coins_spent,
        "favorite_categories": [
            {"category": cat[0], "redemptions": cat[1]}
            for cat in favorite_categories
        ]
    }


def _generate_redemption_code(length: int = 12) -> str:
    """Generate a unique redemption code"""
    characters = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))
