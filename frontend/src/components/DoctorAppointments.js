import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, User, Mail, Phone, 
  MapPin, Stethoscope, CheckCircle, AlertCircle,
  Search, Filter
} from 'lucide-react';
import './DoctorAppointments.css';

const specialties = [
  { id: 'cardiologist', name: 'Cardiologist', icon: '❤️', color: '#ef4444' },
  { id: 'endocrinologist', name: 'Endocrinologist', icon: '⚕️', color: '#10b981' },
  { id: 'pulmonologist', name: 'Pulmonologist', icon: '🫁', color: '#3b82f6' },
  { id: 'general', name: 'General Practitioner', icon: '👨‍⚕️', color: '#667eea' },
  { id: 'nutritionist', name: 'Nutritionist', icon: '🥗', color: '#f59e0b' }
];

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];

const DoctorAppointments = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    reason: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please login to book an appointment');
      navigate('/login');
      return;
    }

    if (!selectedSpecialty || !selectedDate || !selectedTime) {
      alert('Please select specialty, date, and time');
      return;
    }

    // In a real app, this would send to backend
    console.log('Appointment booking:', {
      ...formData,
      specialty: selectedSpecialty,
      date: selectedDate,
      time: selectedTime,
      user: user?.email
    });

    setSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: user?.first_name + ' ' + user?.last_name || '',
        email: user?.email || '',
        phone: '',
        reason: '',
        notes: ''
      });
      setSelectedSpecialty('');
      setSelectedDate('');
      setSelectedTime('');
    }, 3000);
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  // Get maximum date (30 days from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="appointments-container">
      <div className="appointments-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Book a Doctor Appointment
        </motion.h1>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="success-message"
          >
            <CheckCircle size={64} />
            <h2>Appointment Request Submitted!</h2>
            <p>We've received your appointment request. Our team will contact you shortly to confirm.</p>
          </motion.div>
        ) : (
          <>
            {/* Specialty Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="section-card"
            >
              <h2>
                <Stethoscope size={24} />
                Select Specialty
              </h2>
              <div className="specialties-grid">
                {specialties.map((specialty) => (
                  <motion.button
                    key={specialty.id}
                    onClick={() => setSelectedSpecialty(specialty.id)}
                    className={`specialty-card ${selectedSpecialty === specialty.id ? 'selected' : ''}`}
                    style={{
                      borderColor: selectedSpecialty === specialty.id ? specialty.color : 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: selectedSpecialty === specialty.id ? `${specialty.color}25` : 'rgba(255, 255, 255, 0.15)'
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="specialty-icon">{specialty.icon}</span>
                    <span className="specialty-name">{specialty.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Date and Time Selection */}
            {selectedSpecialty && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="section-card"
              >
                <h2>
                  <Clock size={24} />
                  Select Date & Time
                </h2>
                <div className="datetime-selection">
                  <div className="date-selection">
                    <label>Choose Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={today}
                      max={maxDateStr}
                      className="date-input"
                    />
                  </div>
                  {selectedDate && (
                    <div className="time-selection">
                      <label>Available Time Slots</label>
                      <div className="time-slots-grid">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Appointment Form */}
            {selectedDate && selectedTime && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubmit}
                className="appointment-form"
              >
                <h2>
                  <User size={24} />
                  Your Information
                </h2>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <User size={18} />
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || (user?.first_name + ' ' + user?.last_name) || ''}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Mail size={18} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email || user?.email || ''}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Phone size={18} />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+1 (555) 123-4567"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Reason for Visit</label>
                    <input
                      type="text"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your concern"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Additional Notes (Optional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Any additional information you'd like to share..."
                      className="form-textarea"
                    />
                  </div>
                </div>

                {/* Appointment Summary */}
                <div className="appointment-summary">
                  <h3>Appointment Summary</h3>
                  <div className="summary-item">
                    <strong>Specialty:</strong>
                    <span>{specialties.find(s => s.id === selectedSpecialty)?.name}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Date:</strong>
                    <span>{new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Time:</strong>
                    <span>{selectedTime}</span>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="auth-warning">
                    <AlertCircle size={20} />
                    <p>Please <button type="button" onClick={() => navigate('/login')} className="link-button">login</button> to book an appointment</p>
                  </div>
                )}

                <motion.button
                  type="submit"
                  className="submit-appointment-button"
                  disabled={!isAuthenticated}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Calendar size={20} />
                  Book Appointment
                </motion.button>
              </motion.form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorAppointments;
