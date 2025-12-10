"""Populate learning module system with dummy data

Revision ID: populate_learning_data
Revises: update_onboarding_5step
Create Date: 2025-01-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import text

# revision identifiers, used by Alembic.
revision = 'populate_learning_data'
down_revision = 'update_onboarding_5step'
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    
    # First, create some badges for the gamification system
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
        result = conn.execute(text("""
            INSERT INTO badges (id, name, description, rarity, badge_type, is_active, created_at)
            VALUES (uuid_generate_v4(), :name, :description, :rarity, :badge_type, true, NOW())
            RETURNING id
        """), {"name": name, "description": description, "rarity": rarity, "badge_type": badge_type})
        badge_id = result.fetchone()[0]
        badge_ids[name] = badge_id
    
    # Module 1: Getting Started with Homebuying
    conn.execute(text("""
        INSERT INTO modules (id, title, description, order_index, is_active, difficulty_level, 
                            estimated_duration_minutes, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            'Getting Started with Homebuying',
            'Learn the fundamentals of the homebuying process, from understanding the market to preparing for your first purchase.',
            1,
            true,
            'beginner',
            120,
            NOW(),
            NOW()
        )
    """))
    
    module1_result = conn.execute(text("""
        SELECT id FROM modules WHERE title = 'Getting Started with Homebuying'
    """))
    module1_id = module1_result.fetchone()[0]
    
    # Lessons for Module 1
    lessons_module1 = [
        ('Understanding the Real Estate Market', 'Learn how the housing market works and what factors influence home prices.', 1, 25, 50),
        ('Types of Homes', 'Explore different types of residential properties and which might be right for you.', 2, 20, 40),
        ('Setting Your Budget', 'Calculate how much house you can afford and understand your financial readiness.', 3, 30, 60),
        ('Finding the Right Location', 'Learn what to consider when choosing the perfect location for your new home.', 4, 25, 50),
    ]
    
    lesson_ids_module1 = {}
    for title, description, order_idx, duration, coins in lessons_module1:
        result = conn.execute(text("""
            INSERT INTO lessons (id, module_id, title, description, order_index, is_active, 
                               estimated_duration_minutes, nest_coins_reward, created_at, updated_at)
            VALUES (uuid_generate_v4(), :module_id, :title, :description, :order_idx, true, 
                   :duration, :coins, NOW(), NOW())
            RETURNING id
        """), {
            "module_id": module1_id,
            "title": title,
            "description": description,
            "order_idx": order_idx,
            "duration": duration,
            "coins": coins
        })
        lesson_id = result.fetchone()[0]
        lesson_ids_module1[title] = lesson_id
    
    # Quiz Questions and Answers for Module 1, Lesson 1
    lesson1_quiz = [
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
        {
            'question': 'Which economic indicator typically correlates with strong housing demand?',
            'answers': [
                ('Low unemployment rates', True),
                ('High interest rates', False),
                ('Recessions', False),
                ('Stock market crashes', False),
            ],
            'explanation': 'Low unemployment typically means more people have income to purchase homes, increasing demand.'
        },
    ]
    
    # Quiz Questions and Answers for Module 1, Lesson 2
    lesson2_quiz = [
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
        {
            'question': 'Which type of home typically requires monthly HOA fees?',
            'answers': [
                ('Condo or townhouse', True),
                ('Single-family detached homes', False),
                ('All homes', False),
                ('Rental properties only', False),
            ],
            'explanation': 'Condos and townhouses typically have homeowners associations (HOAs) that charge monthly fees for shared amenities and maintenance.'
        },
        {
            'question': 'What should you consider when choosing between a house and a condo?',
            'answers': [
                ('Your lifestyle, maintenance preferences, and budget', True),
                ('Only the purchase price', False),
                ('Nothing, they are identical', False),
                ('Only the location', False),
            ],
            'explanation': 'Consider lifestyle, maintenance preferences, privacy needs, and budget when choosing between different home types.'
        },
    ]
    
    # Quiz Questions and Answers for Module 1, Lesson 3
    lesson3_quiz = [
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
        {
            'question': 'What should be included when calculating your total housing costs?',
            'answers': [
                ('Mortgage, property taxes, insurance, and maintenance', True),
                ('Only the mortgage payment', False),
                ('Only property taxes', False),
                ('Only insurance costs', False),
            ],
            'explanation': 'Total housing costs include principal, interest, taxes, insurance (PITI), plus maintenance and utilities.'
        },
        {
            'question': 'What is a down payment?',
            'answers': [
                ('The initial payment made when purchasing a home', True),
                ('Monthly mortgage payments', False),
                ('Closing costs', False),
                ('Property taxes', False),
            ],
            'explanation': 'A down payment is the initial lump sum payment made when purchasing a home, typically a percentage of the purchase price.'
        },
    ]
    
    # Quiz Questions and Answers for Module 1, Lesson 4
    lesson4_quiz = [
        {
            'question': 'Which factor is most important when choosing a location?',
            'answers': [
                ('It depends on your personal priorities and lifestyle', True),
                ('Only the home price', False),
                ('Only school ratings', False),
                ('Only commute distance', False),
            ],
            'explanation': 'Location priorities vary by individual. Consider commute, schools, amenities, safety, and your lifestyle needs.'
        },
        {
            'question': 'What is a good school district important for, even if you don\'t have children?',
            'answers': [
                ('Property value and resale potential', True),
                ('Nothing, it doesn\'t matter', False),
                ('Only if you plan to have kids', False),
                ('It only affects rental income', False),
            ],
            'explanation': 'Good schools typically increase property values and make homes easier to sell, regardless of whether you have children.'
        },
        {
            'question': 'What should you research about a neighborhood before buying?',
            'answers': [
                ('Crime rates, property values, future development plans, and amenities', True),
                ('Only current property prices', False),
                ('Only crime rates', False),
                ('Nothing, neighborhoods don\'t change', False),
            ],
            'explanation': 'Research multiple aspects: crime statistics, property value trends, planned developments, amenities, and neighborhood character.'
        },
    ]
    
    # Function to insert quiz questions and answers
    def insert_quiz_for_lesson(lesson_id, quiz_data):
        for q_idx, question_data in enumerate(quiz_data, 1):
            result = conn.execute(text("""
                INSERT INTO quiz_questions (id, lesson_id, question_text, question_type, explanation, order_index, is_active, created_at)
                VALUES (uuid_generate_v4(), :lesson_id, :question_text, 'multiple_choice', :explanation, :order_idx, true, NOW())
                RETURNING id
            """), {
                "lesson_id": lesson_id,
                "question_text": question_data['question'],
                "explanation": question_data.get('explanation', ''),
                "order_idx": q_idx
            })
            question_id = result.fetchone()[0]
            
            for a_idx, (answer_text, is_correct) in enumerate(question_data['answers'], 1):
                conn.execute(text("""
                    INSERT INTO quiz_answers (id, question_id, answer_text, is_correct, order_index, created_at)
                    VALUES (uuid_generate_v4(), :question_id, :answer_text, :is_correct, :order_idx, NOW())
                """), {
                    "question_id": question_id,
                    "answer_text": answer_text,
                    "is_correct": is_correct,
                    "order_idx": a_idx
                })
    
    # Insert quizzes for Module 1 lessons
    insert_quiz_for_lesson(lesson_ids_module1['Understanding the Real Estate Market'], lesson1_quiz)
    insert_quiz_for_lesson(lesson_ids_module1['Types of Homes'], lesson2_quiz)
    insert_quiz_for_lesson(lesson_ids_module1['Setting Your Budget'], lesson3_quiz)
    insert_quiz_for_lesson(lesson_ids_module1['Finding the Right Location'], lesson4_quiz)
    
    # Link badges to lessons
    conn.execute(text("""
        INSERT INTO lesson_badge_rewards (id, lesson_id, badge_id, created_at)
        VALUES (uuid_generate_v4(), :lesson_id, :badge_id, NOW())
    """), {
        "lesson_id": lesson_ids_module1['Understanding the Real Estate Market'],
        "badge_id": badge_ids['First Steps']
    })
    
    # Module 2: Mortgage Basics
    conn.execute(text("""
        INSERT INTO modules (id, title, description, order_index, is_active, difficulty_level, 
                            estimated_duration_minutes, prerequisite_module_id, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            'Mortgage Basics',
            'Master the fundamentals of mortgages, including types of loans, interest rates, and the application process.',
            2,
            true,
            'intermediate',
            150,
            :prerequisite_id,
            NOW(),
            NOW()
        )
    """), {"prerequisite_id": module1_id})
    
    module2_result = conn.execute(text("""
        SELECT id FROM modules WHERE title = 'Mortgage Basics'
    """))
    module2_id = module2_result.fetchone()[0]
    
    # Lessons for Module 2
    lessons_module2 = [
        ('Understanding Mortgages', 'Learn the basics of how mortgages work and what they include.', 1, 30, 60),
        ('Types of Mortgage Loans', 'Explore different mortgage options including fixed-rate, adjustable-rate, FHA, and VA loans.', 2, 35, 70),
        ('Mortgage Application Process', 'Step-by-step guide to applying for a mortgage and what lenders look for.', 3, 40, 80),
        ('Mortgage Rates and Terms', 'Understand interest rates, points, loan terms, and how they affect your payments.', 4, 30, 60),
    ]
    
    lesson_ids_module2 = {}
    for title, description, order_idx, duration, coins in lessons_module2:
        result = conn.execute(text("""
            INSERT INTO lessons (id, module_id, title, description, order_index, is_active, 
                               estimated_duration_minutes, nest_coins_reward, created_at, updated_at)
            VALUES (uuid_generate_v4(), :module_id, :title, :description, :order_idx, true, 
                   :duration, :coins, NOW(), NOW())
            RETURNING id
        """), {
            "module_id": module2_id,
            "title": title,
            "description": description,
            "order_idx": order_idx,
            "duration": duration,
            "coins": coins
        })
        lesson_id = result.fetchone()[0]
        lesson_ids_module2[title] = lesson_id
    
    # Quiz for Module 2, Lesson 1
    mortgage_lesson1_quiz = [
        {
            'question': 'What is a mortgage?',
            'answers': [
                ('A loan used to purchase real estate, secured by the property itself', True),
                ('A type of insurance', False),
                ('Property taxes', False),
                ('Down payment assistance', False),
            ],
            'explanation': 'A mortgage is a loan specifically used to purchase real estate, where the property serves as collateral.'
        },
        {
            'question': 'What does LTV stand for?',
            'answers': [
                ('Loan-to-Value ratio', True),
                ('Lender-to-Vendor', False),
                ('Loan Transfer Value', False),
                ('Liability Total Value', False),
            ],
            'explanation': 'Loan-to-Value (LTV) ratio compares the loan amount to the property\'s appraised value.'
        },
        {
            'question': 'Who typically holds the mortgage on a property?',
            'answers': [
                ('A lender such as a bank or mortgage company', True),
                ('The seller', False),
                ('The real estate agent', False),
                ('The government', False),
            ],
            'explanation': 'Lenders such as banks, credit unions, or mortgage companies provide and hold mortgages.'
        },
    ]
    
    insert_quiz_for_lesson(lesson_ids_module2['Understanding Mortgages'], mortgage_lesson1_quiz)
    
    # Module 3: The Homebuying Process
    conn.execute(text("""
        INSERT INTO modules (id, title, description, order_index, is_active, difficulty_level, 
                            estimated_duration_minutes, prerequisite_module_id, created_at, updated_at)
        VALUES (
            uuid_generate_v4(),
            'The Homebuying Process',
            'Navigate through the complete homebuying journey from house hunting to closing day.',
            3,
            true,
            'intermediate',
            180,
            :prerequisite_id,
            NOW(),
            NOW()
        )
    """), {"prerequisite_id": module2_id})
    
    module3_result = conn.execute(text("""
        SELECT id FROM modules WHERE title = 'The Homebuying Process'
    """))
    module3_id = module3_result.fetchone()[0]
    
    # Lessons for Module 3
    lessons_module3 = [
        ('Working with Real Estate Agents', 'Learn how to find and work with the right real estate agent.', 1, 25, 50),
        ('House Hunting Tips', 'Effective strategies for searching and viewing homes.', 2, 30, 60),
        ('Making an Offer', 'Understand how to make a competitive offer and negotiate terms.', 3, 35, 70),
        ('Home Inspection and Appraisal', 'Learn about the inspection process and property appraisal.', 4, 30, 60),
        ('Closing Process', 'Everything you need to know about closing day and finalizing your purchase.', 5, 30, 60),
    ]
    
    lesson_ids_module3 = {}
    for title, description, order_idx, duration, coins in lessons_module3:
        result = conn.execute(text("""
            INSERT INTO lessons (id, module_id, title, description, order_index, is_active, 
                               estimated_duration_minutes, nest_coins_reward, created_at, updated_at)
            VALUES (uuid_generate_v4(), :module_id, :title, :description, :order_idx, true, 
                   :duration, :coins, NOW(), NOW())
            RETURNING id
        """), {
            "module_id": module3_id,
            "title": title,
            "description": description,
            "order_idx": order_idx,
            "duration": duration,
            "coins": coins
        })
        lesson_id = result.fetchone()[0]
        lesson_ids_module3[title] = lesson_id
    
    # Quiz for Module 3, Lesson 1
    process_lesson1_quiz = [
        {
            'question': 'What is the difference between a buyer\'s agent and a listing agent?',
            'answers': [
                ('Buyer\'s agent represents the buyer; listing agent represents the seller', True),
                ('There is no difference', False),
                ('They represent the same client', False),
                ('Buyer\'s agent is always paid by the seller', False),
            ],
            'explanation': 'Buyer\'s agents represent buyers, while listing agents represent sellers in a transaction.'
        },
        {
            'question': 'Should you work with multiple real estate agents simultaneously?',
            'answers': [
                ('No, it\'s best to commit to one agent', True),
                ('Yes, always work with multiple agents', False),
                ('Only if one agent is slow', False),
                ('It doesn\'t matter', False),
            ],
            'explanation': 'Working with one committed agent ensures better service, avoids conflicts, and maintains clear communication.'
        },
    ]
    
    insert_quiz_for_lesson(lesson_ids_module3['Working with Real Estate Agents'], process_lesson1_quiz)
    
    # Link more badges
    conn.execute(text("""
        INSERT INTO lesson_badge_rewards (id, lesson_id, badge_id, created_at)
        VALUES (uuid_generate_v4(), :lesson_id, :badge_id, NOW())
    """), {
        "lesson_id": lesson_ids_module2['Understanding Mortgages'],
        "badge_id": badge_ids['Mortgage Pro']
    })
    
    conn.execute(text("""
        INSERT INTO lesson_badge_rewards (id, lesson_id, badge_id, created_at)
        VALUES (uuid_generate_v4(), :lesson_id, :badge_id, NOW())
    """), {
        "lesson_id": lesson_ids_module3['Closing Process'],
        "badge_id": badge_ids['Module Expert']
    })


def downgrade() -> None:
    conn = op.get_bind()
    
    # Delete in reverse order to maintain referential integrity
    conn.execute(text("DELETE FROM lesson_badge_rewards"))
    conn.execute(text("DELETE FROM quiz_answers"))
    conn.execute(text("DELETE FROM quiz_questions"))
    conn.execute(text("DELETE FROM lessons"))
    conn.execute(text("DELETE FROM modules"))
    conn.execute(text("DELETE FROM badges"))



