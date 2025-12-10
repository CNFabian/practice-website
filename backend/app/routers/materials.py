from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from database import get_db
from auth import get_current_user, get_optional_user
from models import (
    User, MaterialResource, MaterialDownload, CalculatorUsage
)
from schemas import (
    MaterialResourceResponse, CalculatorInput, CalculatorResult, SuccessResponse
)

router = APIRouter()


@router.get("/resources", response_model=List[MaterialResourceResponse])
def get_materials(
    db: Session = Depends(get_db),
    resource_type: Optional[str] = None,
    category: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get all available material resources"""
    query = db.query(MaterialResource).filter(MaterialResource.is_active == True)
    
    if resource_type:
        query = query.filter(MaterialResource.resource_type == resource_type)
    
    if category:
        query = query.filter(MaterialResource.category == category)
    
    materials = query.order_by(MaterialResource.order_index, MaterialResource.title).all()
    
    return [
        MaterialResourceResponse(
            id=material.id,
            title=material.title,
            description=material.description,
            resource_type=material.resource_type,
            file_url=material.file_url,
            external_url=material.external_url,
            thumbnail_url=material.thumbnail_url,
            category=material.category,
            tags=material.tags,
            download_count=material.download_count,
            order_index=material.order_index,
            created_at=material.created_at
        )
        for material in materials
    ]


@router.get("/resources/{resource_id}", response_model=MaterialResourceResponse)
def get_material_resource(
    resource_id: UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get a specific material resource"""
    material = db.query(MaterialResource).filter(
        and_(MaterialResource.id == resource_id, MaterialResource.is_active == True)
    ).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material resource not found"
        )
    
    return MaterialResourceResponse(
        id=material.id,
        title=material.title,
        description=material.description,
        resource_type=material.resource_type,
        file_url=material.file_url,
        external_url=material.external_url,
        thumbnail_url=material.thumbnail_url,
        category=material.category,
        tags=material.tags,
        download_count=material.download_count,
        order_index=material.order_index,
        created_at=material.created_at
    )


@router.post("/resources/{resource_id}/download", response_model=SuccessResponse)
def download_material(
    resource_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Track material download"""
    material = db.query(MaterialResource).filter(
        and_(MaterialResource.id == resource_id, MaterialResource.is_active == True)
    ).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material resource not found"
        )
    
    if not material.file_url and not material.external_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No downloadable file available for this resource"
        )
    
    # Track download
    download_record = MaterialDownload(
        user_id=current_user.id if current_user else None,
        material_id=resource_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    db.add(download_record)
    
    # Increment download count
    material.download_count += 1
    
    db.commit()
    
    download_url = material.file_url if material.file_url else material.external_url
    
    return SuccessResponse(
        message="Download tracked successfully",
        data={"download_url": download_url}
    )


@router.get("/calculators")
def get_available_calculators():
    """Get list of available calculators"""
    return {
        "calculators": [
            {
                "id": "mortgage_payment",
                "name": "Mortgage Payment Calculator",
                "description": "Calculate monthly mortgage payments based on loan amount, interest rate, and term",
                "category": "financing",
                "inputs": [
                    {"name": "loan_amount", "type": "number", "label": "Loan Amount ($)", "required": True},
                    {"name": "interest_rate", "type": "number", "label": "Annual Interest Rate (%)", "required": True},
                    {"name": "loan_term_years", "type": "number", "label": "Loan Term (Years)", "required": True},
                    {"name": "down_payment", "type": "number", "label": "Down Payment ($)", "required": False},
                    {"name": "property_tax", "type": "number", "label": "Annual Property Tax ($)", "required": False},
                    {"name": "insurance", "type": "number", "label": "Annual Insurance ($)", "required": False},
                    {"name": "pmi", "type": "number", "label": "PMI ($)", "required": False}
                ]
            },
            {
                "id": "affordability",
                "name": "Home Affordability Calculator",
                "description": "Determine how much house you can afford based on your income and expenses",
                "category": "planning",
                "inputs": [
                    {"name": "annual_income", "type": "number", "label": "Annual Gross Income ($)", "required": True},
                    {"name": "monthly_debt", "type": "number", "label": "Monthly Debt Payments ($)", "required": True},
                    {"name": "down_payment", "type": "number", "label": "Available Down Payment ($)", "required": True},
                    {"name": "interest_rate", "type": "number", "label": "Expected Interest Rate (%)", "required": True},
                    {"name": "loan_term_years", "type": "number", "label": "Loan Term (Years)", "required": True},
                    {"name": "property_tax_rate", "type": "number", "label": "Property Tax Rate (%)", "required": False},
                    {"name": "insurance_rate", "type": "number", "label": "Insurance Rate (%)", "required": False}
                ]
            },
            {
                "id": "closing_costs",
                "name": "Closing Costs Calculator",
                "description": "Estimate closing costs for your home purchase",
                "category": "costs",
                "inputs": [
                    {"name": "home_price", "type": "number", "label": "Home Price ($)", "required": True},
                    {"name": "loan_amount", "type": "number", "label": "Loan Amount ($)", "required": True},
                    {"name": "location", "type": "text", "label": "State/Location", "required": True},
                    {"name": "loan_type", "type": "select", "label": "Loan Type", "required": True, 
                     "options": ["conventional", "fha", "va", "usda"]},
                    {"name": "points", "type": "number", "label": "Discount Points", "required": False}
                ]
            },
            {
                "id": "rent_vs_buy",
                "name": "Rent vs Buy Calculator",
                "description": "Compare the costs of renting versus buying",
                "category": "planning",
                "inputs": [
                    {"name": "home_price", "type": "number", "label": "Home Price ($)", "required": True},
                    {"name": "down_payment", "type": "number", "label": "Down Payment ($)", "required": True},
                    {"name": "monthly_rent", "type": "number", "label": "Monthly Rent ($)", "required": True},
                    {"name": "interest_rate", "type": "number", "label": "Mortgage Interest Rate (%)", "required": True},
                    {"name": "loan_term_years", "type": "number", "label": "Loan Term (Years)", "required": True},
                    {"name": "years_to_compare", "type": "number", "label": "Years to Compare", "required": True},
                    {"name": "property_tax_rate", "type": "number", "label": "Property Tax Rate (%)", "required": False},
                    {"name": "home_appreciation", "type": "number", "label": "Annual Home Appreciation (%)", "required": False},
                    {"name": "rent_increase", "type": "number", "label": "Annual Rent Increase (%)", "required": False}
                ]
            }
        ]
    }


@router.post("/calculators/calculate", response_model=CalculatorResult)
def calculate(
    calc_input: CalculatorInput,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Perform calculation using specified calculator"""
    calculator_type = calc_input.calculator_type
    input_data = calc_input.input_data
    
    try:
        if calculator_type == "mortgage_payment":
            result = _calculate_mortgage_payment(input_data)
        elif calculator_type == "affordability":
            result = _calculate_affordability(input_data)
        elif calculator_type == "closing_costs":
            result = _calculate_closing_costs(input_data)
        elif calculator_type == "rent_vs_buy":
            result = _calculate_rent_vs_buy(input_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown calculator type: {calculator_type}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Calculation error: {str(e)}"
        )
    
    # Track calculator usage
    usage_record = CalculatorUsage(
        user_id=current_user.id if current_user else None,
        calculator_type=calculator_type,
        input_data=input_data,
        result_data=result,
        session_id=request.headers.get("session-id")
    )
    
    db.add(usage_record)
    db.commit()
    
    return CalculatorResult(
        calculator_type=calculator_type,
        input_data=input_data,
        result_data=result
    )


@router.get("/categories")
def get_material_categories(db: Session = Depends(get_db)):
    """Get available material categories"""
    categories = db.query(MaterialResource.category).filter(
        and_(
            MaterialResource.is_active == True,
            MaterialResource.category.isnot(None)
        )
    ).distinct().all()
    
    resource_types = db.query(MaterialResource.resource_type).filter(
        MaterialResource.is_active == True
    ).distinct().all()
    
    return {
        "categories": [cat[0] for cat in categories if cat[0]],
        "resource_types": [rt[0] for rt in resource_types if rt[0]],
        "predefined_categories": [
            {"id": "calculators", "name": "Calculators", "description": "Interactive financial calculators"},
            {"id": "checklists", "name": "Checklists", "description": "Downloadable checklists and guides"},
            {"id": "templates", "name": "Templates", "description": "Document templates and forms"},
            {"id": "guides", "name": "Guides", "description": "Comprehensive guides and manuals"},
            {"id": "tools", "name": "Tools", "description": "Useful tools and utilities"}
        ]
    }


@router.get("/checklists", response_model=List[MaterialResourceResponse])
def get_checklists(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get all available checklists"""
    checklists = db.query(MaterialResource).filter(
        and_(
            MaterialResource.resource_type == "checklist",
            MaterialResource.is_active == True
        )
    ).order_by(MaterialResource.order_index, MaterialResource.title).all()
    
    return [
        MaterialResourceResponse(
            id=checklist.id,
            title=checklist.title,
            description=checklist.description,
            resource_type=checklist.resource_type,
            file_url=checklist.file_url,
            external_url=checklist.external_url,
            thumbnail_url=checklist.thumbnail_url,
            category=checklist.category,
            tags=checklist.tags,
            download_count=checklist.download_count,
            order_index=checklist.order_index,
            created_at=checklist.created_at
        )
        for checklist in checklists
    ]


def _calculate_mortgage_payment(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate monthly mortgage payment"""
    loan_amount = float(input_data.get("loan_amount", 0))
    interest_rate = float(input_data.get("interest_rate", 0)) / 100 / 12  # Monthly rate
    loan_term_months = int(input_data.get("loan_term_years", 30)) * 12
    down_payment = float(input_data.get("down_payment", 0))
    property_tax = float(input_data.get("property_tax", 0)) / 12  # Monthly
    insurance = float(input_data.get("insurance", 0)) / 12  # Monthly
    pmi = float(input_data.get("pmi", 0))
    
    # Adjust loan amount for down payment
    if down_payment > 0:
        loan_amount = loan_amount - down_payment
    
    # Calculate principal and interest
    if interest_rate > 0:
        monthly_payment = loan_amount * (interest_rate * (1 + interest_rate)**loan_term_months) / ((1 + interest_rate)**loan_term_months - 1)
    else:
        monthly_payment = loan_amount / loan_term_months
    
    total_monthly_payment = monthly_payment + property_tax + insurance + pmi
    total_interest = (monthly_payment * loan_term_months) - loan_amount
    
    return {
        "principal_and_interest": round(monthly_payment, 2),
        "property_tax_monthly": round(property_tax, 2),
        "insurance_monthly": round(insurance, 2),
        "pmi_monthly": round(pmi, 2),
        "total_monthly_payment": round(total_monthly_payment, 2),
        "total_interest": round(total_interest, 2),
        "total_cost": round((monthly_payment * loan_term_months) + down_payment, 2)
    }


def _calculate_affordability(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate home affordability"""
    annual_income = float(input_data.get("annual_income", 0))
    monthly_debt = float(input_data.get("monthly_debt", 0))
    down_payment = float(input_data.get("down_payment", 0))
    interest_rate = float(input_data.get("interest_rate", 0)) / 100 / 12
    loan_term_months = int(input_data.get("loan_term_years", 30)) * 12
    
    monthly_income = annual_income / 12
    
    # Use 28% front-end ratio and 36% back-end ratio
    max_housing_payment = monthly_income * 0.28
    max_total_debt = monthly_income * 0.36
    max_housing_debt_limited = max_total_debt - monthly_debt
    
    # Use the more conservative limit
    max_housing_payment = min(max_housing_payment, max_housing_debt_limited)
    
    # Estimate property tax and insurance (roughly 1.5% of home value annually)
    estimated_tax_insurance_rate = 0.015 / 12
    
    # Calculate maximum loan amount
    # max_payment = P&I + tax + insurance
    # P&I = max_payment - (home_price * tax_insurance_rate)
    # Solve for home_price considering P&I calculation
    
    if interest_rate > 0:
        # This is a complex calculation, simplified here
        payment_factor = interest_rate * (1 + interest_rate)**loan_term_months / ((1 + interest_rate)**loan_term_months - 1)
        max_loan_amount = (max_housing_payment * 0.85) / payment_factor  # 85% for P&I, 15% for tax/insurance
    else:
        max_loan_amount = (max_housing_payment * 0.85) * loan_term_months
    
    max_home_price = max_loan_amount + down_payment
    
    return {
        "max_home_price": round(max_home_price, 2),
        "max_loan_amount": round(max_loan_amount, 2),
        "max_monthly_payment": round(max_housing_payment, 2),
        "monthly_income": round(monthly_income, 2),
        "debt_to_income_ratio": round((monthly_debt / monthly_income) * 100, 2),
        "recommended_down_payment": round(max_home_price * 0.20, 2)
    }


def _calculate_closing_costs(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate estimated closing costs"""
    home_price = float(input_data.get("home_price", 0))
    loan_amount = float(input_data.get("loan_amount", 0))
    location = input_data.get("location", "").lower()
    loan_type = input_data.get("loan_type", "conventional").lower()
    points = float(input_data.get("points", 0))
    
    # Base closing costs (percentages vary by location and loan type)
    title_insurance = home_price * 0.005
    appraisal_fee = 500
    inspection_fee = 400
    attorney_fees = 1000
    recording_fees = 200
    
    # Lender fees
    origination_fee = loan_amount * 0.01
    underwriting_fee = 500
    processing_fee = 300
    
    # Prepaid items
    homeowners_insurance = home_price * 0.003  # Annual premium
    property_taxes = home_price * 0.012 / 12 * 6  # 6 months
    
    # Discount points
    discount_points = loan_amount * (points / 100)
    
    # Adjust for loan type
    if loan_type == "fha":
        fha_upfront_mip = loan_amount * 0.0175
        origination_fee = max(origination_fee, loan_amount * 0.01)
    else:
        fha_upfront_mip = 0
    
    total_closing_costs = (
        title_insurance + appraisal_fee + inspection_fee + attorney_fees + 
        recording_fees + origination_fee + underwriting_fee + processing_fee + 
        homeowners_insurance + property_taxes + discount_points + fha_upfront_mip
    )
    
    return {
        "total_closing_costs": round(total_closing_costs, 2),
        "percentage_of_home_price": round((total_closing_costs / home_price) * 100, 2),
        "breakdown": {
            "title_insurance": round(title_insurance, 2),
            "appraisal_fee": round(appraisal_fee, 2),
            "inspection_fee": round(inspection_fee, 2),
            "attorney_fees": round(attorney_fees, 2),
            "origination_fee": round(origination_fee, 2),
            "prepaid_items": round(homeowners_insurance + property_taxes, 2),
            "discount_points": round(discount_points, 2),
            "other_fees": round(recording_fees + underwriting_fee + processing_fee + fha_upfront_mip, 2)
        }
    }


def _calculate_rent_vs_buy(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Compare renting vs buying costs"""
    home_price = float(input_data.get("home_price", 0))
    down_payment = float(input_data.get("down_payment", 0))
    monthly_rent = float(input_data.get("monthly_rent", 0))
    interest_rate = float(input_data.get("interest_rate", 0)) / 100 / 12
    loan_term_months = int(input_data.get("loan_term_years", 30)) * 12
    years_to_compare = int(input_data.get("years_to_compare", 5))
    property_tax_rate = float(input_data.get("property_tax_rate", 1.2)) / 100
    home_appreciation = float(input_data.get("home_appreciation", 3)) / 100
    rent_increase = float(input_data.get("rent_increase", 2)) / 100
    
    loan_amount = home_price - down_payment
    
    # Calculate monthly mortgage payment
    if interest_rate > 0:
        monthly_mortgage = loan_amount * (interest_rate * (1 + interest_rate)**loan_term_months) / ((1 + interest_rate)**loan_term_months - 1)
    else:
        monthly_mortgage = loan_amount / loan_term_months
    
    # Monthly costs for buying
    monthly_property_tax = (home_price * property_tax_rate) / 12
    monthly_insurance = home_price * 0.003 / 12  # Rough estimate
    monthly_maintenance = home_price * 0.01 / 12  # 1% of home value annually
    
    total_monthly_buy = monthly_mortgage + monthly_property_tax + monthly_insurance + monthly_maintenance
    
    # Calculate costs over the comparison period
    buy_costs = []
    rent_costs = []
    current_rent = monthly_rent
    current_home_value = home_price
    
    for year in range(years_to_compare):
        # Buying costs for this year
        annual_buy_cost = total_monthly_buy * 12
        buy_costs.append(annual_buy_cost)
        
        # Renting costs for this year
        annual_rent_cost = current_rent * 12
        rent_costs.append(annual_rent_cost)
        
        # Update for next year
        current_rent *= (1 + rent_increase)
        current_home_value *= (1 + home_appreciation)
    
    total_buy_cost = sum(buy_costs) + down_payment
    total_rent_cost = sum(rent_costs)
    
    # Calculate home equity after the period
    # Simplified calculation - actual equity would depend on amortization schedule
    remaining_balance = loan_amount * 0.8  # Rough estimate
    home_equity = current_home_value - remaining_balance
    
    net_buy_cost = total_buy_cost - home_equity
    
    return {
        "total_buy_cost": round(total_buy_cost, 2),
        "total_rent_cost": round(total_rent_cost, 2),
        "net_buy_cost": round(net_buy_cost, 2),
        "home_equity": round(home_equity, 2),
        "monthly_mortgage_payment": round(total_monthly_buy, 2),
        "current_monthly_rent": round(monthly_rent, 2),
        "final_monthly_rent": round(current_rent, 2),
        "home_value_after_period": round(current_home_value, 2),
        "recommendation": "buy" if net_buy_cost < total_rent_cost else "rent",
        "savings": round(abs(net_buy_cost - total_rent_cost), 2)
    }
