"""
HubSpot CRM integration for Nest Navigate.

Syncs new users to HubSpot on registration and updates contacts with onboarding
data when onboarding is completed. Requires HUBSPOT_ACCESS_TOKEN (Private App).
If the token is not set, all sync calls are no-ops.
"""
import logging
from typing import Any, Dict, Optional

import httpx

from models import User, UserOnboarding

logger = logging.getLogger(__name__)

HUBSPOT_API_BASE = "https://api.hubapi.com"
HUBSPOT_CONTACTS_SEARCH = f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts/search"
HUBSPOT_CONTACTS_CREATE = f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts"
HUBSPOT_CONTACTS_UPDATE = f"{HUBSPOT_API_BASE}/crm/v3/objects/contacts"


def _get_access_token() -> Optional[str]:
    import os
    token = os.getenv("HUBSPOT_ACCESS_TOKEN", "").strip()
    return token if token else None


def _search_contact_by_email(email: str) -> Optional[str]:
    """Return HubSpot contact ID if found, else None."""
    token = _get_access_token()
    if not token:
        return None
    payload = {
        "filterGroups": [
            {
                "filters": [
                    {"propertyName": "email", "operator": "EQ", "value": email}
                ]
            }
        ]
    }
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                HUBSPOT_CONTACTS_SEARCH,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code != 200:
                logger.warning("HubSpot search failed: %s %s", resp.status_code, resp.text)
                return None
            data = resp.json()
            results = data.get("results") or []
            if not results:
                return None
            return str(results[0].get("id"))
    except Exception as e:
        logger.exception("HubSpot search error for %s: %s", email, e)
        return None


def _create_contact(properties: Dict[str, Any]) -> bool:
    token = _get_access_token()
    if not token:
        return False
    payload = {"properties": properties}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                HUBSPOT_CONTACTS_CREATE,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code in (200, 201):
                logger.info("HubSpot contact created for %s", properties.get("email"))
                return True
            logger.warning("HubSpot create failed: %s %s", resp.status_code, resp.text)
            return False
    except Exception as e:
        logger.exception("HubSpot create error: %s", e)
        return False


def _update_contact(contact_id: str, properties: Dict[str, Any]) -> bool:
    token = _get_access_token()
    if not token:
        return False
    url = f"{HUBSPOT_CONTACTS_UPDATE}/{contact_id}"
    payload = {"properties": properties}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.patch(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            if resp.status_code == 200:
                logger.info("HubSpot contact updated: %s", contact_id)
                return True
            logger.warning("HubSpot update failed: %s %s", resp.status_code, resp.text)
            return False
    except Exception as e:
        logger.exception("HubSpot update error for %s: %s", contact_id, e)
        return False


def _create_or_update_contact(properties: Dict[str, Any]) -> None:
    """Create or update a contact by email. Does nothing if token is missing."""
    if not _get_access_token():
        logger.debug("HubSpot not configured; skipping contact sync")
        return
    email = (properties.get("email") or "").strip()
    if not email:
        logger.warning("HubSpot sync skipped: no email in properties")
        return
    contact_id = _search_contact_by_email(email)
    if contact_id:
        _update_contact(contact_id, properties)
    else:
        _create_contact(properties)


def sync_contact_on_register(user: User) -> None:
    """
    Create or update a HubSpot contact when a user registers.
    Sends core profile fields and nest_navigate_user_id.
    Logs errors and does not raise so registration is never blocked.
    """
    try:
        if not _get_access_token():
            return
        properties = {
            "email": user.email,
            "firstname": user.first_name or "",
            "lastname": user.last_name or "",
            "nest_navigate_user_id": str(user.id),
        }
        if user.phone:
            properties["phone"] = user.phone
        if user.date_of_birth:
            properties["date_of_birth"] = user.date_of_birth.isoformat()
        _create_or_update_contact(properties)
    except Exception as e:
        logger.exception("HubSpot sync on register failed for %s: %s", user.email, e)


def sync_contact_onboarding_complete(user: User, onboarding: UserOnboarding) -> None:
    """
    Update the HubSpot contact with onboarding fields when onboarding is completed.
    Identifies contact by user email. Logs errors and does not raise.
    """
    try:
        if not _get_access_token():
            return
        properties = {
            "email": user.email,
            "firstname": user.first_name or "",
            "lastname": user.last_name or "",
            "nest_navigate_user_id": str(user.id),
            "has_realtor": "true" if onboarding.has_realtor else "false",
            "has_loan_officer": "true" if onboarding.has_loan_officer else "false",
            "wants_expert_contact": (onboarding.wants_expert_contact or ""),
            "homeownership_timeline_months": str(onboarding.homeownership_timeline_months)
            if onboarding.homeownership_timeline_months is not None
            else "",
            "target_cities": ", ".join(onboarding.target_cities) if onboarding.target_cities else "",
        }
        if user.phone:
            properties["phone"] = user.phone
        if user.date_of_birth:
            properties["date_of_birth"] = user.date_of_birth.isoformat()
        _create_or_update_contact(properties)
    except Exception as e:
        logger.exception(
            "HubSpot sync on onboarding complete failed for %s: %s",
            user.email,
            e,
        )
