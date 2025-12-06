#!/usr/bin/env python3
"""
Model Fine-tuning Script with Feedback Data
Automatically retrains ExtraTreesRegressor models using collected user feedback
"""

import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import argparse
from pathlib import Path
from datetime import datetime
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.model_selection import cross_val_score

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    psycopg2 = None

# Model paths
MODEL_DIR = Path(__file__).parent / 'models'
LOG_DIR = Path(__file__).parent / 'training_logs'
LOG_DIR.mkdir(exist_ok=True)

# Supply types mapping (must match the model names)
SUPPLY_TYPES = [
    'air_freshener_mL',
    'disinfectant_mL',
    'glass_cleaner_mL',
    'hand_soap_mL',
    'nonbathroom_tissue_sheets',
    'number_of_workers',
    'toilet_paper_sheets',
    'trash_bags_8gallon'
]

class ModelFinetuner:
    def __init__(self, company_id=None, job_id=None):
        self.company_id = company_id
        self.job_id = job_id
        self.log_file = LOG_DIR / f"training_{job_id or datetime.now().isoformat()}.log"
        self.training_results = {
            'timestamp': datetime.now().isoformat(),
            'company_id': company_id,
            'job_id': job_id,
            'status': 'started',
            'models_trained': {},
            'performance_metrics': {}
        }

    def log(self, message):
        """Log message to console and file"""
        timestamp = datetime.now().isoformat()
        log_msg = f"[{timestamp}] {message}"
        print(log_msg)
        with open(self.log_file, 'a') as f:
            f.write(log_msg + '\n')

    def update_database_status(self, status, metrics=None):
        """Update training job status in database"""
        if not psycopg2 or not self.job_id:
            return

        try:
            conn = psycopg2.connect(
                os.getenv('DATABASE_URL', '')
            )
            cursor = conn.cursor()

            update_data = {
                'status': status,
                'completed_at': datetime.now().isoformat() if status == 'completed' else None,
                'metrics': json.dumps(metrics) if metrics else None
            }

            update_query = """
                UPDATE model_training_jobs 
                SET status = %s, completed_at = %s, metrics = %s
                WHERE id = %s
            """

            cursor.execute(
                update_query,
                (status, update_data['completed_at'], update_data['metrics'], self.job_id)
            )
            conn.commit()
            cursor.close()
            conn.close()
            self.log(f"Database status updated: {status}")
        except Exception as e:
            self.log(f"Warning: Could not update database status: {e}")

    def prepare_training_data(self, feedback_data):
        """Convert feedback data into training format"""
        self.log(f"Preparing training data from {len(feedback_data)} feedback entries")

        # Group by supply type
        supply_data = {}
        for feedback in feedback_data:
            supply_type = feedback['supply_type'].lower().replace(' ', '_')
            if supply_type not in supply_data:
                supply_data[supply_type] = {
                    'predicted': [],
                    'actual': [],
                    'variance': [],
                    'feedback_types': []
                }

            supply_data[supply_type]['predicted'].append(feedback['predicted_qty'])
            supply_data[supply_type]['actual'].append(feedback['actual_qty'])
            supply_data[supply_type]['variance'].append(feedback['variance_pct'])
            supply_data[supply_type]['feedback_types'].append(feedback['feedback_type'])

        return supply_data

    def fine_tune_model(self, supply_type, training_data):
        """Fine-tune a single model with new feedback data"""
        try:
            self.log(f"Fine-tuning model for {supply_type}")

            # Load existing model
            model_path = MODEL_DIR / f'et_model_{supply_type}.joblib'
            preprocessor_path = MODEL_DIR / 'preprocessor.joblib'

            if not model_path.exists():
                self.log(f"Warning: Model file not found for {supply_type}")
                return None

            model = joblib.load(model_path)
            preprocessor = joblib.load(preprocessor_path) if preprocessor_path.exists() else None

            predicted = np.array(training_data['predicted']).reshape(-1, 1)
            actual = np.array(training_data['actual']).reshape(-1, 1)

            # Simple incremental learning: use warm_start if available
            # ExtraTreesRegressor doesn't support warm_start, so we do weighted retraining
            if hasattr(model, 'fit'):
                # Calculate sample weights (give more weight to recent data)
                n_samples = len(predicted)
                weights = np.linspace(0.5, 1.0, n_samples)  # Recent data has more weight

                try:
                    model.fit(predicted, actual.ravel(), sample_weight=weights)
                    self.log(f"Successfully fine-tuned {supply_type}")
                    return model
                except Exception as e:
                    self.log(f"Error fine-tuning {supply_type}: {e}")
                    return None
            else:
                self.log(f"Model does not support fit method: {supply_type}")
                return None

        except Exception as e:
            self.log(f"Error in fine_tune_model for {supply_type}: {e}")
            return None

    def evaluate_model(self, model, test_data):
        """Evaluate model performance"""
        try:
            X = np.array(test_data['predicted']).reshape(-1, 1)
            y = np.array(test_data['actual']).reshape(-1, 1)

            if len(X) < 5:
                self.log("Not enough test samples for cross-validation")
                return None

            # Use cross-validation
            scores = cross_val_score(model, X, y.ravel(), cv=3, scoring='r2_score')
            mean_score = scores.mean()
            std_score = scores.std()

            # Calculate additional metrics
            predictions = model.predict(X)
            mape = np.mean(np.abs((y.ravel() - predictions) / y.ravel())) * 100
            rmse = np.sqrt(np.mean((y.ravel() - predictions) ** 2))

            return {
                'r2_score': float(mean_score),
                'cv_std': float(std_score),
                'mape': float(mape),
                'rmse': float(rmse)
            }
        except Exception as e:
            self.log(f"Error evaluating model: {e}")
            return None

    def train(self, feedback_file):
        """Main training function"""
        try:
            self.log("=" * 60)
            self.log(f"Starting model fine-tuning for company: {self.company_id}")
            self.log("=" * 60)

            # Load feedback data
            if not os.path.exists(feedback_file):
                raise FileNotFoundError(f"Feedback file not found: {feedback_file}")

            with open(feedback_file, 'r') as f:
                feedback_data = json.load(f)

            self.log(f"Loaded {len(feedback_data)} feedback entries")

            # Update status
            self.update_database_status('processing')

            # Prepare training data
            supply_data = self.prepare_training_data(feedback_data)

            # Fine-tune models
            trained_models = {}
            metrics = {}

            for supply_type, training_data in supply_data.items():
                self.log(f"\nProcessing {supply_type}: {len(training_data['actual'])} entries")

                model = self.fine_tune_model(supply_type, training_data)
                if model:
                    # Evaluate
                    eval_metrics = self.evaluate_model(model, training_data)
                    if eval_metrics:
                        model_path = MODEL_DIR / f'et_model_{supply_type}.joblib'
                        joblib.dump(model, model_path)
                        trained_models[supply_type] = str(model_path)
                        metrics[supply_type] = eval_metrics
                        self.log(f"✓ {supply_type} trained - R² Score: {eval_metrics['r2_score']:.3f}")

            # Save training results
            self.training_results['status'] = 'completed'
            self.training_results['models_trained'] = trained_models
            self.training_results['performance_metrics'] = metrics

            # Save results to file
            results_file = LOG_DIR / f"results_{self.job_id or datetime.now().isoformat()}.json"
            with open(results_file, 'w') as f:
                json.dump(self.training_results, f, indent=2)

            self.log("\n" + "=" * 60)
            self.log(f"Training completed successfully")
            self.log(f"Trained models: {len(trained_models)}")
            self.log(f"Results saved to: {results_file}")
            self.log("=" * 60)

            # Update database with final status
            self.update_database_status('completed', metrics)

            return self.training_results

        except Exception as e:
            self.log(f"ERROR during training: {e}")
            self.training_results['status'] = 'failed'
            self.training_results['error'] = str(e)
            self.update_database_status('failed')
            raise

def main():
    parser = argparse.ArgumentParser(description='Fine-tune models with feedback data')
    parser.add_argument('--data-file', type=str, required=True, help='Path to feedback data JSON file')
    parser.add_argument('--company-id', type=str, help='Company ID for company-specific training')
    parser.add_argument('--job-id', type=str, help='Training job ID for database tracking')

    args = parser.parse_args()

    # Initialize trainer
    trainer = ModelFinetuner(company_id=args.company_id, job_id=args.job_id)

    # Run training
    try:
        results = trainer.train(args.data_file)
        
        # Clean up temp file
        if os.path.exists(args.data_file):
            os.remove(args.data_file)
        
        sys.exit(0 if results['status'] == 'completed' else 1)
    except Exception as e:
        trainer.log(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()