document.addEventListener('DOMContentLoaded', function() {
    const bmiForm = document.getElementById('bmiForm');
    const saveBtn = document.getElementById('saveBtn');
    const loadRecordsBtn = document.getElementById('loadRecords');
    const resultDiv = document.getElementById('result');
    const recordsList = document.getElementById('recordsList');
    
    let currentResult = null;
    
    // Обработка формы расчета
    bmiForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const name = document.getElementById('name').value;
        
        try {
            const response = await fetch('/api/bmi/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    weight: parseFloat(weight),
                    height: parseFloat(height),
                    name: name || undefined
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentResult = data;
                displayResult(data);
                saveBtn.style.display = 'inline-block';
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('Ошибка соединения с сервером');
        }
    });
    
    // Сохранение результата
    saveBtn.addEventListener('click', async function() {
        if (!currentResult) return;
        
        try {
            const response = await fetch('/api/bmi/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    weight: currentResult.weight,
                    height: currentResult.height,
                    name: currentResult.name || 'Аноним'
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Результат сохранен успешно!');
                loadRecords();
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('Ошибка при сохранении');
        }
    });
    
    // Загрузка всех записей
    loadRecordsBtn.addEventListener('click', loadRecords);
    
    // Отображение результата
    function displayResult(data) {
        const categoryClass = getCategoryClass(data.category);
        
        resultDiv.innerHTML = `
            <h3>Результат расчета</h3>
            ${data.name ? `<p><strong>Имя:</strong> ${data.name}</p>` : ''}
            <p><strong>Вес:</strong> ${data.weight} кг</p>
            <p><strong>Рост:</strong> ${data.height} см</p>
            <div class="bmi-value ${categoryClass}">${data.bmi}</div>
            <p><strong>Категория:</strong> <span class="${categoryClass}">${data.category}</span></p>
        `;
        resultDiv.style.display = 'block';
        resultDiv.style.background = getCategoryColor(data.category, 0.1);
    }
    
    // Загрузка записей
    async function loadRecords() {
        try {
            const response = await fetch('/api/bmi');
            const data = await response.json();
            
            if (response.ok) {
                displayRecords(data);
            } else {
                showError('Ошибка загрузки записей');
            }
        } catch (error) {
            showError('Ошибка соединения с сервером');
        }
    }
    
    // Отображение записей
    function displayRecords(records) {
        if (records.length === 0) {
            recordsList.innerHTML = '<p>Нет сохраненных записей</p>';
            return;
        }
        
        recordsList.innerHTML = records.map(record => `
            <div class="record-card">
                <h4>${record.name}</h4>
                <p><strong>Вес:</strong> ${record.weight} кг</p>
                <p><strong>Рост:</strong> ${record.height} см</p>
                <p><strong>ИМТ:</strong> <span class="${getCategoryClass(record.category)}">${record.bmi}</span></p>
                <p><strong>Категория:</strong> ${record.category}</p>
                <p><small>${new Date(record.date).toLocaleDateString('ru-RU')}</small></p>
                <button onclick="deleteRecord(${record.id})" style="background: #e74c3c; padding: 5px 10px; font-size: 0.9em;">Удалить</button>
            </div>
        `).join('');
    }
    
    // Удаление записи
    window.deleteRecord = async function(id) {
        if (confirm('Удалить эту запись?')) {
            try {
                const response = await fetch(`/api/bmi/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    loadRecords();
                } else {
                    showError('Ошибка удаления записи');
                }
            } catch (error) {
                showError('Ошибка соединения с сервером');
            }
        }
    };
    
    // Вспомогательные функции
    function getCategoryClass(category) {
        if (category.includes('Недостаточный')) return 'underweight';
        if (category.includes('Нормальный')) return 'normal';
        if (category.includes('Избыточный')) return 'overweight';
        return 'obese';
    }
    
    function getCategoryColor(category, opacity = 1) {
        switch (getCategoryClass(category)) {
            case 'underweight': return `rgba(52, 152, 219, ${opacity})`;
            case 'normal': return `rgba(46, 204, 113, ${opacity})`;
            case 'overweight': return `rgba(243, 156, 18, ${opacity})`;
            case 'obese': return `rgba(231, 76, 60, ${opacity})`;
            default: return '#f0f0f0';
        }
    }
    
    function showError(message) {
        resultDiv.innerHTML = `
            <div style="color: #e74c3c;">
                <h3>Ошибка</h3>
                <p>${message}</p>
            </div>
        `;
        resultDiv.style.display = 'block';
        resultDiv.style.background = 'rgba(231, 76, 60, 0.1)';
    }
    
    // Загружаем записи при загрузке страницы
    loadRecords();
});