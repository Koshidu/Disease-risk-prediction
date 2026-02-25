import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Leaf, Search, Filter, AlertTriangle, 
  FlaskConical, Info, ChevronDown, ChevronUp 
} from 'lucide-react';
import './NaturalRemedies.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NaturalRemedies = () => {
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [expandedRemedies, setExpandedRemedies] = useState({});

  useEffect(() => {
    loadRemedies();
  }, []);

  const loadRemedies = async () => {
    try {
      // Load from CSV or API - for now, we'll use static data
      // In production, you'd fetch from an API endpoint
      const remediesData = [
        {
          condition: 'Diabetes',
          plantName: 'Bitter Melon',
          latinName: 'Momordica charantia',
          partsUsed: 'Fruit, Juice',
          preparation: 'Juice, tea, cooked in food',
          action: 'Insulin-like compounds, may lower blood glucose',
          cautions: 'Strong effect. Can cause hypoglycemia. Avoid if pregnant.'
        },
        {
          condition: 'Diabetes',
          plantName: 'Fenugreek',
          latinName: 'Trigonella foenum-graecum',
          partsUsed: 'Seeds',
          preparation: 'Seeds soaked in water, powder in food',
          action: 'High soluble fiber slows sugar absorption',
          cautions: 'Can lower blood sugar significantly. May interact with diabetes meds.'
        },
        {
          condition: 'Diabetes',
          plantName: 'Cinnamon (Ceylon)',
          latinName: 'Cinnamomum verum',
          partsUsed: 'Bark',
          preparation: 'Powder as spice, tea',
          action: 'May improve insulin sensitivity',
          cautions: 'Use Ceylon variety. High doses of Cassia cinnamon may be toxic to liver.'
        },
        {
          condition: 'Heart Disease',
          plantName: 'Hawthorn',
          latinName: 'Crataegus spp.',
          partsUsed: 'Berries, Leaves, Flowers',
          preparation: 'Tea, tincture, capsules',
          action: 'Cardio-tonic; may improve blood flow, heart muscle strength',
          cautions: 'Interacts with heart medications. Do not use without doctor\'s advice.'
        },
        {
          condition: 'Heart Disease',
          plantName: 'Garlic',
          latinName: 'Allium sativum',
          partsUsed: 'Clove (fresh crushed)',
          preparation: 'Raw in food, aged extract',
          action: 'May lower cholesterol & blood pressure, anti-platelet (thins blood)',
          cautions: 'Strong blood-thinner. Interacts with warfarin, aspirin, before surgery.'
        },
        {
          condition: 'Heart Disease',
          plantName: 'Turmeric',
          latinName: 'Curcuma longa',
          partsUsed: 'Rhizome (root)',
          preparation: 'Powder in food, tea, extract (with black pepper)',
          action: 'Potent anti-inflammatory, may improve blood vessel function',
          cautions: 'High doses may cause stomach upset. Enhances blood-thinning.'
        },
        {
          condition: 'Hypertension',
          plantName: 'Hibiscus',
          latinName: 'Hibiscus sabdariffa',
          partsUsed: 'Flowers',
          preparation: 'Tea (sour, red)',
          action: 'Diuretic, may lower systolic & diastolic blood pressure',
          cautions: 'Can lower BP significantly. May interact with blood pressure meds.'
        },
        {
          condition: 'Hypertension',
          plantName: 'Celery Seed',
          latinName: 'Apium graveolens',
          partsUsed: 'Seeds',
          preparation: 'Extract, tea, culinary',
          action: 'Mild diuretic, vasodilator',
          cautions: 'Strong extracts may interact with diuretic ("water pill") medications.'
        },
        {
          condition: 'Influenza',
          plantName: 'Elderberry',
          latinName: 'Sambucus nigra',
          partsUsed: 'Berries (cooked)',
          preparation: 'Syrup, lozenges, tea (commercial)',
          action: 'Antiviral; may reduce flu duration & severity',
          cautions: 'NEVER eat raw berries - toxic. Use only processed, reputable brands.'
        },
        {
          condition: 'Influenza',
          plantName: 'Echinacea',
          latinName: 'Echinacea purpurea',
          partsUsed: 'Root, Flowers',
          preparation: 'Tincture, tea at onset of symptoms',
          action: 'May stimulate immune response to fight infection',
          cautions: 'Not for long-term daily use. Some may be allergic (daisy family).'
        },
        {
          condition: 'Influenza',
          plantName: 'Ginger',
          latinName: 'Zingiber officinale',
          partsUsed: 'Rhizome (fresh root)',
          preparation: 'Fresh tea, grated in food',
          action: 'Anti-inflammatory, antiviral, relieves nausea',
          cautions: 'Very safe in food amounts. High doses may interact with blood thinners.'
        },
        {
          condition: 'Asthma',
          plantName: 'Boswellia / Frankincense',
          latinName: 'Boswellia serrata',
          partsUsed: 'Resin',
          preparation: 'Extract, capsules',
          action: 'Strong anti-inflammatory for airways',
          cautions: 'Generally safe. May interact with NSAIDs (like ibuprofen).'
        },
        {
          condition: 'Asthma',
          plantName: 'Mullein',
          latinName: 'Verbascum thapsus',
          partsUsed: 'Leaves, Flowers',
          preparation: 'Tea, steam inhalation',
          action: 'Demulcent (soothes) respiratory tract irritation',
          cautions: 'Very gentle and safe for most. Ensure leaves are finely filtered from tea.'
        },
        {
          condition: 'Obesity',
          plantName: 'Green Tea',
          latinName: 'Camellia sinensis',
          partsUsed: 'Leaves',
          preparation: 'Tea (brewed), extract',
          action: 'EGCG & caffeine may boost metabolism & fat oxidation',
          cautions: 'Contains caffeine. May cause anxiety, interact with stimulants, thin blood.'
        },
        {
          condition: 'Obesity',
          plantName: 'Cayenne Pepper',
          latinName: 'Capsicum annuum',
          partsUsed: 'Fruit',
          preparation: 'Powder in food, capsules',
          action: 'Capsaicin may increase metabolism, reduce appetite',
          cautions: 'Can cause stomach irritation. Avoid with ulcers or GERD.'
        }
      ];
      setRemedies(remediesData);
    } catch (error) {
      console.error('Error loading remedies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRemedies = remedies.filter(remedy => {
    const matchesSearch = !searchTerm || 
      remedy.plantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remedy.latinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      remedy.condition.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterCondition || remedy.condition === filterCondition;
    
    return matchesSearch && matchesFilter;
  });

  const uniqueConditions = [...new Set(remedies.map(r => r.condition))].sort();

  const toggleRemedy = (index) => {
    setExpandedRemedies(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getConditionColor = (condition) => {
    const colors = {
      'Diabetes': '#10b981',
      'Heart Disease': '#ef4444',
      'Hypertension': '#f59e0b',
      'Influenza': '#3b82f6',
      'Asthma': '#8b5cf6',
      'Obesity': '#ec4899'
    };
    return colors[condition] || '#667eea';
  };

  if (loading) {
    return (
      <div className="remedies-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading natural remedies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="remedies-container">
      <div className="remedies-content">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-heading"
        >
          Natural Remedies Library
        </motion.h1>
        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="search-filter-section"
        >
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search remedies by name, condition, or plant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={filterCondition}
            onChange={(e) => setFilterCondition(e.target.value)}
            className="filter-select"
          >
            <option value="">All Conditions</option>
            {uniqueConditions.map(condition => (
              <option key={condition} value={condition}>{condition}</option>
            ))}
          </select>
        </motion.div>

        {/* Remedies Grid */}
        <div className="remedies-grid">
          {filteredRemedies.map((remedy, index) => {
            const isExpanded = expandedRemedies[index];
            const conditionColor = getConditionColor(remedy.condition);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="remedy-card"
              >
                <div 
                  className="remedy-card-header"
                  style={{ borderLeftColor: conditionColor }}
                  onClick={() => toggleRemedy(index)}
                >
                  <div className="remedy-icon" style={{ backgroundColor: `${conditionColor}25`, color: conditionColor }}>
                    <Leaf size={24} />
                  </div>
                  <div className="remedy-title-section">
                    <h3>{remedy.plantName}</h3>
                    <p className="latin-name">{remedy.latinName}</p>
                    <div className="remedy-badge" style={{ backgroundColor: conditionColor }}>
                      {remedy.condition}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="remedy-card-body"
                  >
                    <div className="remedy-detail-item">
                      <strong>
                        <FlaskConical size={16} />
                        Parts Used:
                      </strong>
                      <span>{remedy.partsUsed}</span>
                    </div>

                    <div className="remedy-detail-item">
                      <strong>
                        <Info size={16} />
                        Preparation & Use:
                      </strong>
                      <span>{remedy.preparation}</span>
                    </div>

                    <div className="remedy-detail-item">
                      <strong>Key Action/Claim:</strong>
                      <span>{remedy.action}</span>
                    </div>

                    {remedy.cautions && (
                      <div className="remedy-cautions">
                        <AlertTriangle size={18} />
                        <div>
                          <strong>Important Cautions:</strong>
                          <p>{remedy.cautions}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="remedy-card-footer" onClick={() => toggleRemedy(index)}>
                  <span>{isExpanded ? 'Show Less' : 'Learn More'}</span>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredRemedies.length === 0 && (
          <div className="no-results">
            <Search size={48} />
            <h3>No remedies found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="remedies-disclaimer">
        <AlertTriangle size={24} />
        <div>
          <strong>Important Disclaimer:</strong>
          <p>
            Natural remedies are for informational purposes only. Always consult with a healthcare 
            professional before using any natural remedy, especially if you have existing medical 
            conditions or are taking medications. Some remedies may interact with medications or 
            have side effects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NaturalRemedies;
