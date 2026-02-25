import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Send, MessageSquare,
  CheckCircle, AlertCircle, Clock, Globe
} from 'lucide-react';
import './ContactUs.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields');
      return;
    }

    // In a real app, this would send to backend
    console.log('Contact form submitted:', formData);
    
    setSubmitted(true);
    setError('');
    
    // Reset form after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 5000);
  };

  const contactInfo = [
    {
      icon: <Mail size={24} />,
      title: 'Email Us',
      content: 'support@predictacare.com',
      link: 'mailto:support@predictacare.com',
      color: '#3b82f6'
    },
    {
      icon: <Phone size={24} />,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      link: 'tel:+15551234567',
      color: '#10b981'
    },
    {
      icon: <MapPin size={24} />,
      title: 'Visit Us',
      content: '123 Health Street, Medical District, City 12345',
      link: '#',
      color: '#ef4444'
    },
    {
      icon: <Clock size={24} />,
      title: 'Business Hours',
      content: 'Mon - Fri: 9:00 AM - 6:00 PM',
      link: '#',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="contact-container">
      <div className="contact-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Contact Us
        </motion.h1>
        <div className="contact-grid">
          {/* Contact Information Cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="contact-info-section"
          >
            <h2>Get in Touch</h2>
            <p className="section-description">
              Have questions or need assistance? We're here to help you with any inquiries 
              about our services, appointments, or health information.
            </p>

            <div className="contact-info-cards">
              {contactInfo.map((info, index) => (
                <motion.a
                  key={index}
                  href={info.link}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="contact-info-card"
                  style={{ borderLeftColor: info.color }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="info-icon" style={{ backgroundColor: `${info.color}25`, color: info.color }}>
                    {info.icon}
                  </div>
                  <div className="info-content">
                    <h3>{info.title}</h3>
                    <p>{info.content}</p>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Social Media / Additional Info */}
            <div className="additional-info">
              <h3>Follow Us</h3>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Twitter</a>
                <a href="#" className="social-link">LinkedIn</a>
                <a href="#" className="social-link">Instagram</a>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="contact-form-section"
          >
            <h2>Send us a Message</h2>
            
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="success-message"
              >
                <CheckCircle size={48} />
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="error-message"
                  >
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </motion.div>
                )}

                <div className="form-group">
                  <label htmlFor="name">
                    <MessageSquare size={18} />
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">
                    <MessageSquare size={18} />
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="What is this regarding?"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">
                    <MessageSquare size={18} />
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Tell us how we can help you..."
                    className="form-textarea"
                  />
                </div>

                <motion.button
                  type="submit"
                  className="submit-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Send size={20} />
                  Send Message
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="faq-section"
        >
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How accurate is the disease prediction?</h3>
              <p>Our AI model has been trained on extensive medical data and achieves high accuracy. However, predictions are for informational purposes only and should not replace professional medical advice.</p>
            </div>
            <div className="faq-item">
              <h3>Is my data secure?</h3>
              <p>Yes, we take data security seriously. All your personal information and health data are encrypted and stored securely. We never share your data with third parties.</p>
            </div>
            <div className="faq-item">
              <h3>Can I cancel an appointment?</h3>
              <p>Yes, you can cancel or reschedule appointments through your dashboard or by contacting us directly. We require at least 24 hours notice for cancellations.</p>
            </div>
            <div className="faq-item">
              <h3>Are the natural remedies safe?</h3>
              <p>While natural remedies can be beneficial, it's important to consult with a healthcare professional before using them, especially if you have existing conditions or are taking medications.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
