import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Droplet, Wind, Brain, Activity, 
  AlertCircle, Search, ChevronRight, Info 
} from 'lucide-react';
import './DiseasesKnowledge.css';

const diseases = [
  {
    id: 'diabetes',
    name: 'Diabetes',
    category: 'Metabolic',
    icon: <Droplet size={32} />,
    color: '#10b981',
    description: 'A chronic condition that affects how your body processes blood sugar (glucose).',
    symptoms: [
      'Increased thirst and urination',
      'Fatigue and weakness',
      'Blurred vision',
      'Slow-healing sores',
      'Frequent infections'
    ],
    causes: [
      'Type 1: Autoimmune destruction of insulin-producing cells',
      'Type 2: Insulin resistance and reduced insulin production',
      'Genetic factors and family history',
      'Obesity and sedentary lifestyle',
      'Poor diet high in sugar and processed foods'
    ],
    prevention: [
      'Maintain a healthy weight',
      'Eat a balanced diet with whole grains',
      'Exercise regularly (at least 30 minutes daily)',
      'Monitor blood sugar levels',
      'Avoid smoking and excessive alcohol'
    ],
    specialist: 'Endocrinologist'
  },
  {
    id: 'heart-disease',
    name: 'Heart Disease',
    category: 'Cardiac',
    icon: <Heart size={32} />,
    color: '#ef4444',
    description: 'A range of conditions affecting the heart, including coronary artery disease, heart failure, and arrhythmias.',
    symptoms: [
      'Chest pain or discomfort',
      'Shortness of breath',
      'Fatigue and weakness',
      'Irregular heartbeat',
      'Swelling in legs, ankles, or feet'
    ],
    causes: [
      'High blood pressure',
      'High cholesterol levels',
      'Smoking and tobacco use',
      'Diabetes and obesity',
      'Family history of heart disease',
      'Sedentary lifestyle'
    ],
    prevention: [
      'Quit smoking',
      'Maintain healthy blood pressure',
      'Control cholesterol levels',
      'Exercise regularly',
      'Eat a heart-healthy diet',
      'Manage stress effectively'
    ],
    specialist: 'Cardiologist'
  },
  {
    id: 'hypertension',
    name: 'Hypertension',
    category: 'Cardiac',
    icon: <Activity size={32} />,
    color: '#f59e0b',
    description: 'High blood pressure, a condition where the force of blood against artery walls is consistently too high.',
    symptoms: [
      'Often no symptoms (silent condition)',
      'Headaches',
      'Shortness of breath',
      'Nosebleeds',
      'Dizziness or lightheadedness'
    ],
    causes: [
      'Age (risk increases with age)',
      'Family history',
      'Obesity and overweight',
      'Lack of physical activity',
      'High salt intake',
      'Excessive alcohol consumption',
      'Chronic stress'
    ],
    prevention: [
      'Reduce sodium intake',
      'Maintain healthy weight',
      'Exercise regularly',
      'Limit alcohol consumption',
      'Manage stress',
      'Quit smoking',
      'Eat potassium-rich foods'
    ],
    specialist: 'Cardiologist'
  },
  {
    id: 'influenza',
    name: 'Influenza',
    category: 'Respiratory',
    icon: <Wind size={32} />,
    color: '#3b82f6',
    description: 'A contagious respiratory illness caused by influenza viruses that infect the nose, throat, and sometimes the lungs.',
    symptoms: [
      'Fever and chills',
      'Cough and sore throat',
      'Runny or stuffy nose',
      'Muscle or body aches',
      'Headaches',
      'Fatigue'
    ],
    causes: [
      'Influenza viruses (Type A, B, or C)',
      'Airborne transmission',
      'Contact with contaminated surfaces',
      'Weakened immune system',
      'Close contact with infected individuals'
    ],
    prevention: [
      'Get annual flu vaccination',
      'Wash hands frequently',
      'Avoid close contact with sick people',
      'Cover mouth when coughing or sneezing',
      'Stay home when sick',
      'Maintain good hygiene practices'
    ],
    specialist: 'General Practitioner'
  },
  {
    id: 'asthma',
    name: 'Asthma',
    category: 'Respiratory',
    icon: <Wind size={32} />,
    color: '#8b5cf6',
    description: 'A chronic respiratory condition that causes inflammation and narrowing of the airways, making breathing difficult.',
    symptoms: [
      'Wheezing (whistling sound when breathing)',
      'Shortness of breath',
      'Chest tightness',
      'Coughing, especially at night',
      'Difficulty breathing during physical activity'
    ],
    causes: [
      'Genetic factors and family history',
      'Environmental allergens (pollen, dust, pet dander)',
      'Respiratory infections',
      'Air pollution and irritants',
      'Exercise-induced triggers',
      'Cold air or weather changes'
    ],
    prevention: [
      'Identify and avoid triggers',
      'Use prescribed inhalers correctly',
      'Monitor breathing regularly',
      'Create an asthma action plan',
      'Keep indoor air clean',
      'Get regular check-ups',
      'Stay up to date with vaccinations'
    ],
    specialist: 'Pulmonologist'
  },
  {
    id: 'obesity',
    name: 'Obesity',
    category: 'Metabolic',
    icon: <Activity size={32} />,
    color: '#ec4899',
    description: 'A complex disease involving excessive body fat that increases the risk of other health problems.',
    symptoms: [
      'Excessive body weight',
      'Difficulty with physical activity',
      'Shortness of breath',
      'Fatigue',
      'Joint pain',
      'Sleep apnea'
    ],
    causes: [
      'Calorie imbalance (more calories consumed than burned)',
      'Sedentary lifestyle',
      'Poor dietary choices',
      'Genetic factors',
      'Medical conditions (hypothyroidism, PCOS)',
      'Certain medications',
      'Lack of sleep'
    ],
    prevention: [
      'Maintain a balanced diet',
      'Regular physical exercise',
      'Portion control',
      'Limit processed and sugary foods',
      'Get adequate sleep',
      'Manage stress',
      'Stay hydrated'
    ],
    specialist: 'Nutritionist'
  }
];

const DiseasesKnowledge = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDisease, setSelectedDisease] = useState(null);

  const filteredDiseases = diseases.filter(disease =>
    disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    disease.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = [...new Set(diseases.map(d => d.category))];

  return (
    <div className="diseases-knowledge-container">
      <div className="diseases-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Diseases Knowledge Base
        </motion.h1>
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="search-section"
        >
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search diseases by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </motion.div>

        {/* Disease Cards Grid */}
        {!selectedDisease && (
          <div className="diseases-grid">
            {filteredDiseases.map((disease, index) => (
              <motion.div
                key={disease.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="disease-card"
                onClick={() => setSelectedDisease(disease)}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="disease-card-header" style={{ backgroundColor: `${disease.color}15` }}>
                  <div className="disease-icon" style={{ color: disease.color }}>
                    {disease.icon}
                  </div>
                  <div className="disease-badge" style={{ backgroundColor: disease.color }}>
                    {disease.category}
                  </div>
                </div>
                <div className="disease-card-body">
                  <h3>{disease.name}</h3>
                  <p>{disease.description}</p>
                  <div className="disease-specialist">
                    <Info size={16} />
                    <span>See: {disease.specialist}</span>
                  </div>
                </div>
                <div className="disease-card-footer">
                  <span>Learn More</span>
                  <ChevronRight size={18} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Disease Detail View */}
        {selectedDisease && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="disease-detail"
          >
            <button onClick={() => setSelectedDisease(null)} className="back-button">
              ← Back to Diseases
            </button>

            <div className="disease-detail-header" style={{ backgroundColor: `${selectedDisease.color}15` }}>
              <div className="detail-icon" style={{ color: selectedDisease.color }}>
                {selectedDisease.icon}
              </div>
              <div>
                <h2>{selectedDisease.name}</h2>
                <p className="disease-category">{selectedDisease.category}</p>
              </div>
            </div>

            <div className="disease-detail-content">
              <section className="detail-section">
                <h3>Overview</h3>
                <p>{selectedDisease.description}</p>
              </section>

              <section className="detail-section">
                <h3>
                  <AlertCircle size={20} />
                  Common Symptoms
                </h3>
                <ul className="detail-list">
                  {selectedDisease.symptoms.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-section">
                <h3>Possible Causes</h3>
                <ul className="detail-list">
                  {selectedDisease.causes.map((cause, idx) => (
                    <li key={idx}>{cause}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-section">
                <h3>Prevention Tips</h3>
                <ul className="detail-list">
                  {selectedDisease.prevention.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </section>

              <div className="specialist-info">
                <Info size={20} />
                <div>
                  <strong>Recommended Specialist:</strong>
                  <span>{selectedDisease.specialist}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {filteredDiseases.length === 0 && (
          <div className="no-results">
            <Search size={48} />
            <h3>No diseases found</h3>
            <p>Try searching with different keywords</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseasesKnowledge;
