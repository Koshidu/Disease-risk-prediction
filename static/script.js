// Handle form submission
document.getElementById('predictionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('predictBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    const resultsSection = document.getElementById('resultsSection');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    
    // Hide previous results
    resultsSection.style.display = 'none';
    
    // Collect form data
    const formData = {};
    const form = document.getElementById('predictionForm');
    const formElements = form.elements;
    
    for (let element of formElements) {
        if (element.name && element.value) {
            formData[element.name] = element.value;
        }
    }
    
    try {
        // Send prediction request
        const response = await fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Display results
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
});

function displayResults(data) {
    const resultsSection = document.getElementById('resultsSection');
    const predictionCard = document.getElementById('predictionCard');
    
    // Display main prediction
    document.getElementById('predictedDisease').textContent = data.prediction.disease;
    document.getElementById('confidenceBadge').textContent = `${data.prediction.confidence}% Confidence`;
    document.getElementById('diseaseCategory').textContent = data.prediction.category;
    document.getElementById('specialist').textContent = data.prediction.specialist;
    
    // Display alternatives
    const alternativesSection = document.getElementById('alternativesSection');
    const alternativesList = document.getElementById('alternativesList');
    
    if (data.alternatives && data.alternatives.length > 0) {
        alternativesSection.style.display = 'block';
        alternativesList.innerHTML = '';
        
        data.alternatives.forEach(alt => {
            const altItem = document.createElement('div');
            altItem.className = 'alternative-item';
            altItem.innerHTML = `
                <span><strong>${alt.disease}</strong></span>
                <span>${alt.confidence}%</span>
            `;
            alternativesList.appendChild(altItem);
        });
    } else {
        alternativesSection.style.display = 'none';
    }
    
    // Display remedies
    const remediesList = document.getElementById('remediesList');
    remediesList.innerHTML = '';
    
    if (data.remedies && data.remedies.length > 0) {
        data.remedies.forEach(remedy => {
            const remedyCard = document.createElement('div');
            remedyCard.className = 'remedy-card';
            remedyCard.innerHTML = `
                <h4>${remedy.plant_name}</h4>
                <p class="latin-name">${remedy.latin_name}</p>
                <p><strong>Parts Used:</strong> ${remedy.parts_used}</p>
                <p><strong>Preparation:</strong> ${remedy.preparation}</p>
                <p><strong>Action:</strong> ${remedy.action}</p>
                ${remedy.cautions ? `<div class="cautions"><strong>⚠️ Cautions:</strong> ${remedy.cautions}</div>` : ''}
            `;
            remediesList.appendChild(remedyCard);
        });
    } else {
        remediesList.innerHTML = '<p>No natural remedies found for this condition.</p>';
    }
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showError(message) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${message}
        </div>
        <button class="reset-btn" onclick="resetForm()">🔄 Try Again</button>
    `;
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
    document.getElementById('predictionForm').reset();
    document.getElementById('resultsSection').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Check if model is loaded on page load and get accuracy
window.addEventListener('load', async () => {
    try {
        const response = await fetch('/health');
        const data = await response.json();
        
        if (!data.model_loaded) {
            const formSection = document.querySelector('.form-section');
            const warning = document.createElement('div');
            warning.className = 'error-message';
            warning.innerHTML = '<strong>⚠️ Warning:</strong> Model not loaded. Please run <code>python train_model.py</code> first.';
            formSection.insertBefore(warning, formSection.firstChild);
        } else {
            // Try to get model info including accuracy
            try {
                const infoResponse = await fetch('/model-info');
                const infoData = await infoResponse.json();
                
                if (infoData.accuracy) {
                    const badge = document.getElementById('modelInfoBadge');
                    const accuracySpan = document.getElementById('modelAccuracy');
                    accuracySpan.textContent = infoData.accuracy.toFixed(2);
                    badge.style.display = 'block';
                }
            } catch (error) {
                console.log('Could not load model accuracy info');
            }
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
});
