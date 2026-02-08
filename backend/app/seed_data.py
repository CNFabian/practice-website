"""
Seed learning content data for development/testing
Run manually: python seed_data.py

This script populates the database with sample modules, lessons, quizzes, and badges.
Unlike migrations, this is meant to be run optionally and can be re-run safely.
"""
import os
import sys
import uuid
from datetime import datetime

# Add the app directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from database import SessionLocal


def seed_badges(db):
    """Create gamification badges"""
    print("🎖️  Creating badges...")
    
    badges_data = [
        ('First Steps', 'Complete your first lesson', 'common', 'achievement'),
        ('Knowledge Seeker', 'Complete 5 lessons', 'common', 'achievement'),
        ('Quiz Master', 'Score 100% on a quiz', 'rare', 'quiz'),
        ('Module Expert', 'Complete a full module', 'rare', 'module'),
        ('Mortgage Pro', 'Complete the Mortgage Basics module', 'epic', 'specialty'),
        ('Homebuying Hero', 'Complete all modules', 'legendary', 'mastery'),
        ('Perfect Score', 'Get 100% on 3 quizzes', 'epic', 'quiz'),
        ('Consistent Learner', 'Complete lessons for 7 consecutive days', 'rare', 'streak'),
    ]
    
    badge_ids = {}
    for name, description, rarity, badge_type in badges_data:
        # Check if badge already exists (no unique constraint on name, so we can't use ON CONFLICT)
        existing = db.execute(text("SELECT id FROM badges WHERE name = :name"), {"name": name}).fetchone()
        if existing:
            badge_ids[name] = existing[0]
            print(f"  → Badge already exists: {name}")
        else:
            badge_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO badges (id, name, description, rarity, badge_type, is_active, created_at)
                VALUES (:id, :name, :description, :rarity, :badge_type, true, NOW())
            """), {
                "id": badge_id,
                "name": name,
                "description": description,
                "rarity": rarity,
                "badge_type": badge_type
            })
            badge_ids[name] = badge_id
            print(f"  ✓ Created badge: {name}")
    
    return badge_ids


def seed_module_1(db, badge_ids):
    """Create Module 1: Getting Started with Homebuying"""
    print("\n📚 Creating Module 1: Getting Started with Homebuying...")
    
    # Check if module exists
    result = db.execute(text("SELECT id FROM modules WHERE title = 'Getting Started with Homebuying'"))
    existing = result.fetchone()
    if existing:
        print("  → Module already exists, skipping...")
        return existing[0]
    
    module1_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO modules (id, title, description, order_index, is_active, difficulty_level, 
                            estimated_duration_minutes, created_at, updated_at)
        VALUES (:id, :title, :description, 1, true, 'beginner', 120, NOW(), NOW())
    """), {
        "id": module1_id,
        "title": 'Getting Started with Homebuying',
        "description": 'Learn the fundamentals of the homebuying process, from understanding the market to preparing for your first purchase.'
    })
    print(f"  ✓ Created module")
    
    # Create lessons
    lessons = [
        ('Understanding the Real Estate Market', 'Learn how the housing market works and what factors influence home prices.', 1, 25, 50),
        ('Types of Homes', 'Explore different types of residential properties and which might be right for you.', 2, 20, 40),
        ('Setting Your Budget', 'Calculate how much house you can afford and understand your financial readiness.', 3, 30, 60),
        ('Finding the Right Location', 'Learn what to consider when choosing the perfect location for your new home.', 4, 25, 50),
    ]
    
    lesson_ids = {}
    for title, description, order_idx, duration, coins in lessons:
        lesson_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO lessons (id, module_id, title, description, order_index, is_active, 
                               estimated_duration_minutes, nest_coins_reward, created_at, updated_at,
                               lesson_summary)
            VALUES (:id, :module_id, :title, :description, :order_idx, true, 
                   :duration, :coins, NOW(), NOW(), :summary)
        """), {
            "id": lesson_id,
            "module_id": module1_id,
            "title": title,
            "description": description,
            "order_idx": order_idx,
            "duration": duration,
            "coins": coins,
            "summary": description[:100]
        })
        lesson_ids[title] = lesson_id
        print(f"  ✓ Created lesson: {title}")
    
    # Add quiz questions
    quiz_data = {
        'Understanding the Real Estate Market': [
            {
                'question': 'What is the primary factor that influences home prices in a market?',
                'answers': [
                    ('Supply and demand', True),
                    ('The season of the year', False),
                    ('Random fluctuations', False),
                    ('Government policies only', False),
                ],
                'explanation': 'Supply and demand is the fundamental economic principle that drives home prices.'
            },
            {
                'question': 'What does a buyer\'s market indicate?',
                'answers': [
                    ('More homes available than buyers', True),
                    ('More buyers than available homes', False),
                    ('Prices are always lower', False),
                    ('No homes for sale', False),
                ],
                'explanation': 'In a buyer\'s market, there are more homes available than buyers, giving buyers more negotiating power.'
            },
        ],
        'Types of Homes': [
            {
                'question': 'What is the main difference between a condo and a single-family home?',
                'answers': [
                    ('Condos share walls and common areas with neighbors', True),
                    ('Condos are always cheaper', False),
                    ('Single-family homes have no maintenance', False),
                    ('There is no difference', False),
                ],
                'explanation': 'Condos typically share walls and common areas, while single-family homes are standalone structures.'
            },
        ],
        'Setting Your Budget': [
            {
                'question': 'What is the general rule for how much of your monthly income should go toward housing?',
                'answers': [
                    ('No more than 28-30% of gross monthly income', True),
                    ('At least 50% of monthly income', False),
                    ('100% is fine if you save elsewhere', False),
                    ('There is no rule', False),
                ],
                'explanation': 'The 28/36 rule suggests spending no more than 28% of gross monthly income on housing costs.'
            },
        ],
    }
    
    for lesson_title, questions in quiz_data.items():
        lesson_id = lesson_ids.get(lesson_title)
        if not lesson_id:
            continue
        
        for q_idx, q_data in enumerate(questions, 1):
            question_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, 
                                           explanation, order_index, is_active, created_at)
                VALUES (:id, :lesson_id, :text, 'multiple_choice', :explanation, :order_idx, true, NOW())
            """), {
                "id": question_id,
                "lesson_id": lesson_id,
                "text": q_data['question'],
                "explanation": q_data['explanation'],
                "order_idx": q_idx
            })
            
            for a_idx, (answer_text, is_correct) in enumerate(q_data['answers'], 1):
                db.execute(text("""
                    INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, order_index, created_at)
                    VALUES (:id, :question_id, :text, :is_correct, :order_idx, NOW())
                """), {
                    "id": str(uuid.uuid4()),
                    "question_id": question_id,
                    "text": answer_text,
                    "is_correct": is_correct,
                    "order_idx": a_idx
                })
    
    print(f"  ✓ Created quiz questions for lessons")
    
    # Link badge to first lesson
    if 'First Steps' in badge_ids:
        db.execute(text("""
            INSERT INTO lesson_badge_rewards (id, lesson_id, badge_id, created_at)
            VALUES (:id, :lesson_id, :badge_id, NOW())
            ON CONFLICT DO NOTHING
        """), {
            "id": str(uuid.uuid4()),
            "lesson_id": lesson_ids['Understanding the Real Estate Market'],
            "badge_id": badge_ids['First Steps']
        })
        print(f"  ✓ Linked 'First Steps' badge")
    
    return module1_id


def seed_module_2(db, module1_id, badge_ids):
    """Create Module 2: Mortgage Basics"""
    print("\n📚 Creating Module 2: Mortgage Basics...")
    
    # Check if module exists
    result = db.execute(text("SELECT id FROM modules WHERE title = 'Mortgage Basics'"))
    existing = result.fetchone()
    if existing:
        print("  → Module already exists, skipping...")
        return existing[0]
    
    module2_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO modules (id, title, description, order_index, is_active, difficulty_level, 
                            estimated_duration_minutes, prerequisite_module_id, created_at, updated_at)
        VALUES (:id, :title, :description, 2, true, 'intermediate', 150, :prereq, NOW(), NOW())
    """), {
        "id": module2_id,
        "title": 'Mortgage Basics',
        "description": 'Master the fundamentals of mortgages, including types of loans, interest rates, and the application process.',
        "prereq": module1_id
    })
    print(f"  ✓ Created module")
    
    # Create lessons
    lessons = [
        ('Understanding Mortgages', 'Learn the basics of how mortgages work and what they include.', 1, 30, 60),
        ('Types of Mortgage Loans', 'Explore different mortgage options including fixed-rate, adjustable-rate, FHA, and VA loans.', 2, 35, 70),
        ('Mortgage Application Process', 'Step-by-step guide to applying for a mortgage and what lenders look for.', 3, 40, 80),
    ]
    
    lesson_ids = {}
    for title, description, order_idx, duration, coins in lessons:
        lesson_id = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO lessons (id, module_id, title, description, order_index, is_active, 
                               estimated_duration_minutes, nest_coins_reward, created_at, updated_at,
                               lesson_summary)
            VALUES (:id, :module_id, :title, :description, :order_idx, true, 
                   :duration, :coins, NOW(), NOW(), :summary)
        """), {
            "id": lesson_id,
            "module_id": module2_id,
            "title": title,
            "description": description,
            "order_idx": order_idx,
            "duration": duration,
            "coins": coins,
            "summary": description[:100]
        })
        lesson_ids[title] = lesson_id
        print(f"  ✓ Created lesson: {title}")
    
    # Link mortgage pro badge
    if 'Mortgage Pro' in badge_ids and 'Understanding Mortgages' in lesson_ids:
        db.execute(text("""
            INSERT INTO lesson_badge_rewards (id, lesson_id, badge_id, created_at)
            VALUES (:id, :lesson_id, :badge_id, NOW())
            ON CONFLICT DO NOTHING
        """), {
            "id": str(uuid.uuid4()),
            "lesson_id": lesson_ids['Understanding Mortgages'],
            "badge_id": badge_ids['Mortgage Pro']
        })
        print(f"  ✓ Linked 'Mortgage Pro' badge")
    
    return module2_id


def main():
    """Main seeding function"""
    print("\n" + "="*60)
    print("🌱 SEEDING DATABASE WITH LEARNING CONTENT")
    print("="*60 + "\n")
    
    # Check if already seeded
    db = SessionLocal()
    try:
        result = db.execute(text("SELECT COUNT(*) FROM modules"))
        module_count = result.scalar()
        
        if module_count > 0:
            print(f"ℹ️  Database already has {module_count} module(s).")
            response = input("   Do you want to continue and potentially create duplicates? (yes/no): ")
            if response.lower() != 'yes':
                print("\n✅ Seeding cancelled.")
                return
        
        print("Starting seed process...\n")
        
        # Seed data
        badge_ids = seed_badges(db)
        module1_id = seed_module_1(db, badge_ids)
        module2_id = seed_module_2(db, module1_id, badge_ids)
        
        # Commit all changes
        db.commit()
        
        print("\n" + "="*60)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"\nCreated:")
        print(f"  • {len(badge_ids)} badges")
        print(f"  • 2 modules")
        print(f"  • 7 lessons")
        print(f"  • Multiple quiz questions and answers")
        print("\n")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
