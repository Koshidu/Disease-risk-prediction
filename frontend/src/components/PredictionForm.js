import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import './PredictionForm.css';

const initialFormData = {
  Age: '',
  Gender: '',
  Ethnicity: '',
  Family_History: '',
  Smoking: '',
  Alcohol: '',
  Diet_Habits: '',
  Physical_Activity: '',
  Pre_existing_Conditions: '',
  Current_Medications: '',
  Symptom_Cough: 'No',
  Symptom_Fever: 'No',
  Symptom_ChestPain: 'No',
  Symptom_Fatigue: 'No',
  Symptom_Duration: '',
  Symptom_Severity: '',
  Living_Area: ''
};

const PredictionForm = ({ onSubmit, loading, resetKey }) => {
  const [formData, setFormData] = useState(initialFormData);
  const formRef = useRef(null);
  
  // Reset form when resetKey changes or when component becomes visible
  useEffect(() => {
    setFormData(initialFormData);
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [resetKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const formFields = [
    { name: 'Age', type: 'number', required: true, min: 1, max: 120 },
    { name: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
    { name: 'Ethnicity', type: 'select', required: true, options: ['Caucasian', 'African American', 'Asian', 'Hispanic', 'Other'] },
    { name: 'Family_History', type: 'select', required: true, options: ['Yes', 'No'] },
    { name: 'Smoking', type: 'select', required: true, options: ['No', 'Occasional', 'Daily'] },
    { name: 'Alcohol', type: 'select', required: true, options: ['No', 'Social', 'Frequent'] },
    { name: 'Diet_Habits', type: 'select', required: true, options: ['Healthy', 'Balanced', 'High sugar', 'Processed food'] },
    { name: 'Physical_Activity', type: 'select', required: true, options: ['Low', 'Moderate', 'High'] },
    { name: 'Pre_existing_Conditions', type: 'select', required: false, options: ['', 'Asthma', 'Diabetes', 'Hypertension'] },
    { name: 'Current_Medications', type: 'select', required: false, options: ['', 'Inhaler', 'Insulin', 'Metformin', 'Beta-blocker'] },
    { name: 'Symptom_Cough', type: 'select', required: false, options: ['No', 'Yes', 'Maybe'] },
    { name: 'Symptom_Fever', type: 'select', required: false, options: ['No', 'Yes', 'Maybe'] },
    { name: 'Symptom_ChestPain', type: 'select', required: false, options: ['No', 'Yes', 'Maybe'] },
    { name: 'Symptom_Fatigue', type: 'select', required: false, options: ['No', 'Yes', 'Maybe'] },
    { name: 'Symptom_Duration', type: 'select', required: true, options: ['1-3 days', '1 week', '2+ weeks', '1+ month'] },
    { name: 'Symptom_Severity', type: 'select', required: true, options: ['Mild', 'Moderate', 'Severe'] },
    { name: 'Living_Area', type: 'select', required: true, options: ['Urban', 'Rural'] }
  ];

  const getFieldLabel = (name) => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="form-container"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="prediction-form">
        <div className="form-grid">
          {formFields.map((field, index) => (
            <motion.div
              key={field.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="form-group"
            >
              <label htmlFor={field.name}>
                {getFieldLabel(field.name)}
                {field.required && <span className="required">*</span>}
              </label>
              {field.type === 'number' ? (
                <input
                  type="number"
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  min={field.min}
                  max={field.max}
                  className="form-input"
                />
              ) : (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  required={field.required}
                  className="form-select"
                >
                  <option value="">Select {getFieldLabel(field.name)}</option>
                  {field.options.map(option => (
                    <option key={option} value={option}>
                      {option || 'None'}
                    </option>
                  ))}
                </select>
              )}
            </motion.div>
          ))}
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="submit-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <span className="button-loader"></span>
              Analyzing...
            </>
          ) : (
            <>
              <Send size={20} />
              Predict Disease Risk
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default PredictionForm;
