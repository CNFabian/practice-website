"""
Unit tests for utils (QuizManager and Grow Your Nest helpers).

Tests pure logic: quiz score, pass/fail, coin reward, tree stage and completion.
No database required.
"""
import sys
import os
from decimal import Decimal

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from utils import QuizManager
from routers.grow_your_nest import (
    calculate_tree_stage,
    is_tree_complete,
    TREE_TOTAL_STAGES,
    POINTS_PER_STAGE,
)


# ----- QuizManager -----


def test_calculate_quiz_score_full():
    score = QuizManager.calculate_quiz_score(10, 10)
    assert score == Decimal("100.00")


def test_calculate_quiz_score_half():
    score = QuizManager.calculate_quiz_score(5, 10)
    assert score == Decimal("50.00")


def test_calculate_quiz_score_zero_correct():
    score = QuizManager.calculate_quiz_score(0, 10)
    assert score == Decimal("0.00")


def test_calculate_quiz_score_zero_total():
    score = QuizManager.calculate_quiz_score(0, 0)
    assert score == Decimal("0.00")


def test_calculate_quiz_score_rounding():
    score = QuizManager.calculate_quiz_score(7, 9)
    assert score == Decimal((7 / 9 * 100)).quantize(Decimal("0.01"))


def test_determine_quiz_pass_at_threshold():
    assert QuizManager.determine_quiz_pass(Decimal("70.00")) is True
    assert QuizManager.determine_quiz_pass(Decimal("70.01")) is True


def test_determine_quiz_pass_below_threshold():
    assert QuizManager.determine_quiz_pass(Decimal("69.99")) is False
    assert QuizManager.determine_quiz_pass(Decimal("0.00")) is False


def test_determine_quiz_pass_custom_threshold():
    assert QuizManager.determine_quiz_pass(Decimal("80.00"), passing_score=Decimal("80.00")) is True
    assert QuizManager.determine_quiz_pass(Decimal("79.00"), passing_score=Decimal("80.00")) is False


def test_calculate_coin_reward_perfect_score():
    coins = QuizManager.calculate_coin_reward(100, Decimal("100.00"))
    assert coins == 100 + 50


def test_calculate_coin_reward_90_plus():
    coins = QuizManager.calculate_coin_reward(100, Decimal("95.00"))
    assert coins == 100 + 25


def test_calculate_coin_reward_70_plus():
    coins = QuizManager.calculate_coin_reward(100, Decimal("85.00"))
    assert coins == 100


def test_calculate_coin_reward_below_70():
    coins = QuizManager.calculate_coin_reward(100, Decimal("60.00"))
    assert coins == 0


def test_calculate_coin_reward_custom_perfect_bonus():
    coins = QuizManager.calculate_coin_reward(50, Decimal("100.00"), perfect_bonus=100)
    assert coins == 50 + 100


# ----- Grow Your Nest tree helpers -----


def test_calculate_tree_stage_zero():
    assert calculate_tree_stage(0) == 0


def test_calculate_tree_stage_below_first_stage():
    assert calculate_tree_stage(POINTS_PER_STAGE - 1) == 0


def test_calculate_tree_stage_first_stage():
    assert calculate_tree_stage(POINTS_PER_STAGE) == 1
    assert calculate_tree_stage(POINTS_PER_STAGE + 1) == 1


def test_calculate_tree_stage_max_stage():
    max_points = TREE_TOTAL_STAGES * POINTS_PER_STAGE
    assert calculate_tree_stage(max_points) == TREE_TOTAL_STAGES
    assert calculate_tree_stage(max_points + 100) == TREE_TOTAL_STAGES


def test_calculate_tree_stage_intermediate():
    assert calculate_tree_stage(2 * POINTS_PER_STAGE) == 2
    assert calculate_tree_stage(3 * POINTS_PER_STAGE) == 3


def test_is_tree_complete_false():
    assert is_tree_complete(0) is False
    assert is_tree_complete(TREE_TOTAL_STAGES * POINTS_PER_STAGE - 1) is False


def test_is_tree_complete_true():
    assert is_tree_complete(TREE_TOTAL_STAGES * POINTS_PER_STAGE) is True
    assert is_tree_complete(TREE_TOTAL_STAGES * POINTS_PER_STAGE + 50) is True
