// K6 Load Test Script Configuration - JavaScript Logic

class K6ConfigApp {
    constructor() {
        this.state = {
            mode: 'modify',
            baseUrl: '',
            botId: '', // <-- Add this line
            environment: '',
            service: '',
            stages: [{id: 1, duration: '1m', target: 10, selected: false}],
            endpoints: [{
                id: 1,
                method: 'GET',
                path: '/',
                headers: [],
                payload: '',
                expectedStatus: 200,
                collapsed: false,
                selected: false
            }],
            thresholdDuration: 'p(95)<500',
            thresholdError: 'rate<0.05',
            thinkTime: 1,
            storedVariables: {}
        };
        
        this.selectionState = {
            stages: {selectAll: false, selected: []},
            endpoints: {selectAll: false, selected: []},
            headers: {}
        };

        this.idCounters = {
            stage: 1,
            endpoint: 1,
            header: 1
        };

        this.pendingConfirmation = null;
        this.codeEditor = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
           // File upload
        document.getElementById('fileUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
         // FIXED: Load data based on initial mode
        if (this.state.mode === 'modify') {
            this.loadDataFromProvideJsonHere();
        }
        this.initCodeEditor();
        this.renderStages();
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
    }

    // FIXED: Populate all form fields with loaded data
    populateFormFields() {
        document.getElementById('baseUrl').value = this.state.baseUrl;
        document.getElementById('botId').value = this.state.botId; // <-- Add this line
        document.getElementById('environment').value = this.state.environment;
        document.getElementById('service').value = this.state.service;
        document.getElementById('thresholdDuration').value = this.state.thresholdDuration;
        document.getElementById('thresholdError').value = this.state.thresholdError;
        document.getElementById('thinkTime').value = this.state.thinkTime;
        document.getElementById('numStages').value = this.state.stages.length;
        document.getElementById('numEndpoints').value = this.state.endpoints.length;
    }

    renderAll() {
        this.renderStages();
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
    }

    initCodeEditor() {
        const textarea = document.getElementById('generatedScript');
        this.codeEditor = CodeMirror.fromTextArea(textarea, {
            mode: 'javascript',
            theme: 'material-darker',
            lineNumbers: true,
            readOnly: false,
            lineWrapping: true,
            tabSize: 2,
            indentWithTabs: false,
            styleActiveLine: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"]
        });
    }

    updateSectionTitles() {
        const stagesCount = this.state.stages.length;
        const endpointsCount = this.state.endpoints.length;
        
        const stagesTitle = `Test Stages (Ramping Virtual Users) - ${stagesCount} Stage${stagesCount !== 1 ? 's' : ''}`;
        const endpointsTitle = `API Endpoints Configuration - ${endpointsCount} Endpoint${endpointsCount !== 1 ? 's' : ''}`;
        
        document.getElementById('stagesTitle').textContent = stagesTitle;
        document.getElementById('endpointsTitle').textContent = endpointsTitle;
    }

    bindEvents() {
        // Mode selection
        // FIXED: Mode selection with proper data loading
        document.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.state.mode = e.target.value;
                
                if (e.target.value === 'modify') {
                    this.loadExistingData(); // Load sample K6 config
                } else {
                    this.clearAllData(); // Clear for new script
                }
                
                this.renderAll();
            });
        });

        // Stored variables: add
        const addStoredVarBtn = document.getElementById('addStoredVar');
        if (addStoredVarBtn) {
            addStoredVarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const nameEl = document.getElementById('newVarName');
                const keyEl = document.getElementById('newVarKey');
                const valEl = document.getElementById('newVarValue');
                const varName = (nameEl?.value || '').trim();
                const varKey = (keyEl?.value || '').trim();
                const varValue = (valEl?.value || '').trim();
                if (!varName || !varKey || !varValue) {
                    this.showMessage('Please provide variable name, header key, and value', 'error');
                    return;
                }
                this.upsertStoredVariable(varName, varKey, varValue);
                this.renderEndpoints();
                this.updateGeneratedScript();
                nameEl.value = '';
                keyEl.value = '';
                valEl.value = '';
                this.showToast(`Stored variable ${varName} added`, 'success');
            });
        }

        // Stored variables: prefill x-api-key
        const prefillBtn = document.getElementById('prefillApiKeyVar');
        if (prefillBtn) {
            prefillBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const nameEl = document.getElementById('newVarName');
                const keyEl = document.getElementById('newVarKey');
                const valEl = document.getElementById('newVarValue');
                if (nameEl) nameEl.value = 'API_KEY';
                if (keyEl) keyEl.value = 'x-api-key';
                if (valEl) valEl.value = '';
            });
        }


        // Base configuration
        document.getElementById('baseUrl').addEventListener('input', (e) => {
            this.state.baseUrl = e.target.value;
            this.updateGeneratedScript();
        });

        document.getElementById('environment').addEventListener('input', (e) => {
            this.state.environment = e.target.value;
            this.updateGeneratedScript();
        });

        document.getElementById('service').addEventListener('input', (e) => {
            this.state.service = e.target.value;
            this.updateGeneratedScript();
        });

        document.getElementById('botId').addEventListener('input', (e) => {
            this.state.botId = e.target.value;
            this.updateGeneratedScript();
        });

        // Removed API Key direct binding under Bot Configuration

        // Stages
        document.getElementById('numStages').addEventListener('change', (e) => {
            const numStages = parseInt(e.target.value);
            this.updateStagesCount(numStages);
        });

        // Endpoints
        document.getElementById('numEndpoints').addEventListener('change', (e) => {
            const numEndpoints = parseInt(e.target.value);
            this.updateEndpointsCount(numEndpoints);
        });

        // Thresholds and think time
        document.getElementById('thresholdDuration').addEventListener('input', (e) => {
            this.state.thresholdDuration = e.target.value;
            this.updateGeneratedScript();
        });

        document.getElementById('thresholdError').addEventListener('input', (e) => {
            this.state.thresholdError = e.target.value;
            this.updateGeneratedScript();
        });

        document.getElementById('thinkTime').addEventListener('input', (e) => {
            this.state.thinkTime = parseFloat(e.target.value);
            this.updateGeneratedScript();
        });

        // Selection events
        this.bindSelectionEvents();

        // Action buttons
        document.getElementById('downloadScript').addEventListener('click', () => {
            this.downloadScript();
        });

        document.getElementById('clearAllData').addEventListener('click', () => {
            this.confirmAction('Clear All Data', 'This will remove all stages, endpoints, and configuration. Are you sure?', () => {
                this.clearAllData();
            });
        });

        // Modal events
        document.getElementById('confirmYes').addEventListener('click', () => {
            this.executeConfirmedAction();
        });

        document.getElementById('confirmNo').addEventListener('click', () => {
            this.hideModal();
        });

        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.hideModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && !e.target.matches('input, textarea, select')) {
                this.handleKeyboardDelete();
            }
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    bindSelectionEvents() {
        // Select all stages
        document.getElementById('selectAllStages').addEventListener('change', (e) => {
            this.toggleSelectAllStages(e.target.checked);
        });

        // Select all endpoints
        document.getElementById('selectAllEndpoints').addEventListener('change', (e) => {
            this.toggleSelectAllEndpoints(e.target.checked);
        });

        // Bulk delete buttons
        document.getElementById('deleteSelectedStages').addEventListener('click', () => {
            this.bulkDeleteStages();
        });

        document.getElementById('deleteSelectedEndpoints').addEventListener('click', () => {
            this.bulkDeleteEndpoints();
        });

        // Add new buttons
        document.getElementById('addNewStage').addEventListener('click', () => {
            this.addNewStage();
        });

        document.getElementById('addNewEndpoint').addEventListener('click', () => {
            this.addNewEndpoint();
        });
    }

    // Stage Management
    updateStagesCount(count) {
        while (this.state.stages.length < count) {
            this.state.stages.push({
                id: ++this.idCounters.stage,
                duration: '1m',
                target: (this.state.stages.length + 1) * 10,
                selected: false
            });
        }
        if (this.state.stages.length > count) {
            this.state.stages = this.state.stages.slice(0, count);
        }
        this.renderStages();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
    }

    addNewStage() {
        this.state.stages.push({
            id: ++this.idCounters.stage,
            duration: '1m',
            target: (this.state.stages.length + 1) * 10,
            selected: false
        });
        document.getElementById('numStages').value = this.state.stages.length;
        this.renderStages();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
        this.showToast('New stage added successfully', 'success');
    }

    renderStages() {
        const container = document.getElementById('stagesContainer');
        container.innerHTML = '';

        this.state.stages.forEach((stage, index) => {
            const stageDiv = document.createElement('div');
            stageDiv.className = `stage-row ${stage.selected ? 'selected' : ''}`;
            stageDiv.innerHTML = `
                <div class="stage-checkbox">
                    <input type="checkbox" ${stage.selected ? 'checked' : ''} 
                           data-stage-id="${stage.id}" class="stage-select-checkbox">
                </div>
                <div class="form-group">
                    <label class="form-label">Stage ${index + 1} duration (e.g. 30s, 1m)</label>
                    <input type="text" class="form-control" value="${stage.duration}" 
                           data-stage-index="${index}" data-field="duration">
                </div>
                <div class="form-group">
                    <label class="form-label">Stage ${index + 1} VUs</label>
                    <input type="number" class="form-control" value="${stage.target}" min="1" 
                           data-stage-index="${index}" data-field="target">
                </div>
                <button class="stage-delete-btn" data-stage-id="${stage.id}" title="Delete stage">
                    🗑️
                </button>
            `;
            container.appendChild(stageDiv);
        });

        // Bind stage events
        this.bindStageEvents(container);
    }

    bindStageEvents(container) {
        // Stage field inputs
        container.querySelectorAll('input[data-stage-index]').forEach(input => {
            input.addEventListener('input', (e) => {
                const stageIndex = parseInt(e.target.dataset.stageIndex);
                const field = e.target.dataset.field;
                const value = field === 'target' ? parseInt(e.target.value) : e.target.value;
                this.state.stages[stageIndex][field] = value;
                this.updateGeneratedScript();
            });
        });

        // Stage selection checkboxes
        container.querySelectorAll('.stage-select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const stageId = parseInt(e.target.dataset.stageId);
                this.toggleStageSelection(stageId, e.target.checked);
            });
        });

        // Stage delete buttons
        container.querySelectorAll('.stage-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stageId = parseInt(e.target.dataset.stageId);
                this.deleteStage(stageId);
            });
        });
    }

    toggleStageSelection(stageId, selected) {
        const stage = this.state.stages.find(s => s.id === stageId);
        if (stage) {
            stage.selected = selected;
            this.updateSelectionCounts();
            this.renderStages();
        }
    }

    toggleSelectAllStages(selectAll) {
        this.state.stages.forEach(stage => {
            stage.selected = selectAll;
        });
        this.selectionState.stages.selectAll = selectAll;
        this.updateSelectionCounts();
        this.renderStages();
    }

    deleteStage(stageId) {
        const stage = this.state.stages.find(s => s.id === stageId);
        if (!stage) return;

        this.confirmAction(
            'Delete Stage',
            `Are you sure you want to delete this stage?`,
            () => {
                this.state.stages = this.state.stages.filter(s => s.id !== stageId);
                document.getElementById('numStages').value = this.state.stages.length;
                this.renderStages();
                this.updateGeneratedScript();
                this.updateSelectionCounts();
                this.updateSectionTitles();
                this.showToast('Stage deleted successfully', 'success');
            }
        );
    }

    bulkDeleteStages() {
        const selectedStages = this.state.stages.filter(s => s.selected);
        if (selectedStages.length === 0) return;

        this.confirmAction(
            'Delete Selected Stages',
            `Are you sure you want to delete ${selectedStages.length} selected stage(s)?`,
            () => {
                this.state.stages = this.state.stages.filter(s => !s.selected);
                document.getElementById('numStages').value = this.state.stages.length;
                this.renderStages();
                this.updateGeneratedScript();
                this.updateSelectionCounts();
                this.updateSectionTitles();
                this.showToast(`${selectedStages.length} stage(s) deleted successfully`, 'success');
            }
        );
    }

    // Endpoint Management
    updateEndpointsCount(count) {
        if (count < 0) count = 0;
        
        while (this.state.endpoints.length < count) {
            this.state.endpoints.push({
                id: ++this.idCounters.endpoint,
                method: 'GET',
                path: '/',
                headers: [],
                payload: '',
                expectedStatus: 200,
                collapsed: false,
                selected: false
            });
        }
        if (this.state.endpoints.length > count) {
            this.state.endpoints = this.state.endpoints.slice(0, count);
        }
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
    }

    addNewEndpoint() {
        this.state.endpoints.push({
            id: ++this.idCounters.endpoint,
            method: 'GET',
            path: '/',
            headers: [],
            payload: '',
            expectedStatus: 200,
            collapsed: false,
            selected: false
        });
        document.getElementById('numEndpoints').value = this.state.endpoints.length;
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
        this.showToast('New endpoint added successfully', 'success');
    }

    renderEndpoints() {
        const container = document.getElementById('endpointsContainer');
        container.innerHTML = '';

        if (this.state.endpoints.length === 0) {
            container.innerHTML = '<p class="small-text">No endpoints configured</p>';
            this.updateStoredVariablesDisplay();
            return;
        }

        this.state.endpoints.forEach((endpoint, index) => {
            const endpointDiv = this.createEndpointElement(endpoint, index);
            container.appendChild(endpointDiv);
        });

        this.updateStoredVariablesDisplay();
    }

    createEndpointElement(endpoint, index) {
        const endpointDiv = document.createElement('div');
        endpointDiv.className = `endpoint-container ${endpoint.selected ? 'selected' : ''}`;
        
        const collapsed = endpoint.collapsed ? 'collapsed' : '';
        const contentClass = endpoint.collapsed ? 'endpoint-content collapsed' : 'endpoint-content';
        
        const displayUrl = this.state.baseUrl 
            ? `${this.state.baseUrl}${endpoint.path}`
            : endpoint.path;
        endpointDiv.innerHTML = `
            <div class="endpoint-header ${collapsed}" data-endpoint-index="${index}">
                <div class="endpoint-header-left">
                    <input type="checkbox" ${endpoint.selected ? 'checked' : ''} 
                           data-endpoint-id="${endpoint.id}" class="endpoint-select-checkbox">
                    <span>Endpoint ${index + 1}</span>
                    <span class="endpoint-url">${endpoint.method} ${displayUrl}</span>
                </div>
                <div class="endpoint-header-right">
                    <button class="endpoint-delete-btn" data-endpoint-id="${endpoint.id}" title="Delete endpoint">
                        🗑️
                    </button>
                    <span class="collapse-icon">▼</span>
                </div>
            </div>
            <div class="${contentClass}">
                ${this.createEndpointContent(endpoint, index)}
            </div>
        `;

        // Bind events after the element is created
        setTimeout(() => {
            this.bindEndpointEvents(endpointDiv, index);
        }, 0);

        return endpointDiv;
    }

    createEndpointContent(endpoint, index) {
        const showPayload = endpoint.method === 'POST' || endpoint.method === 'PUT';
        
        return `
            <div class="endpoint-basics">
                <div class="form-group">
                    <label class="form-label">Method</label>
                    <select class="form-control" data-endpoint-index="${index}" data-field="method">
                        <option value="GET" ${endpoint.method === 'GET' ? 'selected' : ''}>GET</option>
                        <option value="POST" ${endpoint.method === 'POST' ? 'selected' : ''}>POST</option>
                        <option value="PUT" ${endpoint.method === 'PUT' ? 'selected' : ''}>PUT</option>
                        <option value="DELETE" ${endpoint.method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Path</label>
                    <input type="text" class="form-control" value="${endpoint.path}" 
                           data-endpoint-index="${index}" data-field="path" placeholder="/api/endpoint">
                </div>
            </div>
            
            <div class="headers-section">
                <h4>Headers</h4>
                <div class="num-headers-control">
                    <label class="form-label">Number of headers</label>
                    <input type="number" class="form-control" min="0" value="${endpoint.headers.length}" 
                           data-endpoint-index="${index}" data-field="numHeaders">
                </div>
                <div class="headers-table-container">
                    ${this.createHeadersTable(endpoint.headers, index)}
                </div>
            </div>
            
            ${showPayload ? `
            <div class="payload-section">
                <label class="form-label">Payload</label>
                <textarea class="form-control" data-endpoint-index="${index}" data-field="payload" 
                          placeholder='{"key": "value"}'>${endpoint.payload}</textarea>
            </div>
            ` : ''}
            
            <div class="status-section">
                <div class="form-group">
                    <label class="form-label">Expected Status Code</label>
                    <input type="number" class="form-control" value="${endpoint.expectedStatus}" 
                           min="100" max="599" data-endpoint-index="${index}" data-field="expectedStatus">
                </div>
            </div>
        `;
    }

    createHeadersTable(headers, endpointIndex) {
        if (headers.length === 0) {
            return '<p class="small-text">No headers configured</p>';
        }

        const selectedHeaders = headers.filter(h => h.selected).length;
        const totalHeaders = headers.length;

        let tableHTML = `
            <div class="headers-container">
                <div class="headers-bulk-controls">
                    <label class="checkbox-label">
                        <input type="checkbox" class="select-all-headers" 
                               data-endpoint-index="${endpointIndex}" 
                               ${selectedHeaders === totalHeaders && totalHeaders > 0 ? 'checked' : ''}>
                        <span>Select All Headers</span>
                    </label>
                    <div class="headers-selection-info">
                        <span>${selectedHeaders} of ${totalHeaders} selected</span>
                        <button class="btn btn--sm delete-btn" 
                                data-endpoint-index="${endpointIndex}" 
                                data-action="delete-selected-headers"
                                ${selectedHeaders === 0 ? 'disabled' : ''}>
                            🗑️ Delete Selected
                        </button>
                    </div>
                </div>
                <div class="headers-header">
                    <span>Select</span>
                    <span>Mode</span>
                    <span>Key</span>
                    <span>Value</span>
                    <span>Variable</span>
                    <span>Delete</span>
                </div>
        `;

        headers.forEach((header, headerIndex) => {
            tableHTML += this.createHeaderRow(header, endpointIndex, headerIndex);
        });

        tableHTML += '</div>';
        return tableHTML;
    }

    createHeaderRow(header, endpointIndex, headerIndex) {
        const storedVarOptions = Object.keys(this.state.storedVariables).map(varName => 
            `<option value="${varName}" ${header.selectedVar === varName ? 'selected' : ''}>${varName}</option>`
        ).join('');

        const showVarName = header.mode === 'Store';
        const showUseVar = header.mode === 'Use';
        const isReadonly = header.mode === 'Use';

        const selectedVarData = header.selectedVar ? this.state.storedVariables[header.selectedVar] : null;
        const keyPlaceholder = isReadonly && selectedVarData ? `Using: ${selectedVarData.key}` : 'Header key';
        const valuePlaceholder = isReadonly && selectedVarData ? `Using: ${selectedVarData.value}` : 'Header value';

        return `
            <div class="header-row ${header.selected ? 'selected' : ''}">
                <input type="checkbox" ${header.selected ? 'checked' : ''} 
                       class="header-select-checkbox" 
                       data-endpoint-index="${endpointIndex}" 
                       data-header-index="${headerIndex}">
                <select class="form-control" data-endpoint-index="${endpointIndex}" 
                        data-header-index="${headerIndex}" data-field="mode">
                    <option value="Manual" ${header.mode === 'Manual' ? 'selected' : ''}>Manual</option>
                    <option value="Store" ${header.mode === 'Store' ? 'selected' : ''}>Store</option>
                    <option value="Use" ${header.mode === 'Use' ? 'selected' : ''}>Use</option>
                </select>
                <input type="text" class="form-control" placeholder="${keyPlaceholder}" value="${header.key || ''}" 
                       data-endpoint-index="${endpointIndex}" data-header-index="${headerIndex}" data-field="key"
                       ${isReadonly ? 'readonly' : ''}>
                <input type="text" class="form-control" placeholder="${valuePlaceholder}" value="${header.value || ''}" 
                       data-endpoint-index="${endpointIndex}" data-header-index="${headerIndex}" data-field="value"
                       ${isReadonly ? 'readonly' : ''}>
                <div class="variable-cell">
                    <input type="text" class="form-control var-column" placeholder="Variable name" value="${header.varName || ''}" 
                           data-endpoint-index="${endpointIndex}" data-header-index="${headerIndex}" data-field="varName"
                           style="${showVarName ? '' : 'display:none'}">
                    <select class="form-control use-column" data-endpoint-index="${endpointIndex}" 
                            data-header-index="${headerIndex}" data-field="selectedVar"
                            style="${showUseVar ? '' : 'display:none'}">
                        <option value="">Select variable</option>
                        ${storedVarOptions}
                    </select>
                </div>
                <button class="header-delete-btn" 
                        data-endpoint-index="${endpointIndex}" 
                        data-header-index="${headerIndex}" title="Delete header">
                    🗑️
                </button>
            </div>
        `;
    }

    bindEndpointEvents(endpointDiv, endpointIndex) {
        // Endpoint selection checkbox
        const endpointCheckbox = endpointDiv.querySelector('.endpoint-select-checkbox');
        if (endpointCheckbox) {
            endpointCheckbox.addEventListener('change', (e) => {
                const endpointId = parseInt(e.target.dataset.endpointId);
                this.toggleEndpointSelection(endpointId, e.target.checked);
            });
        }

        // Endpoint delete button
        const deleteBtn = endpointDiv.querySelector('.endpoint-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const endpointId = parseInt(e.target.dataset.endpointId);
                this.deleteEndpoint(endpointId);
            });
        }

        // Collapse/expand (excluding delete button clicks)
        const header = endpointDiv.querySelector('.endpoint-header');
        header.addEventListener('click', (e) => {
            if (!e.target.matches('.endpoint-delete-btn, .endpoint-select-checkbox')) {
                this.toggleEndpoint(endpointIndex);
            }
        });

        // Header selection events
        this.bindHeaderSelectionEvents(endpointDiv, endpointIndex);

        // Basic field events
        endpointDiv.querySelectorAll('[data-endpoint-index]:not([data-header-index])').forEach(input => {
            const field = input.dataset.field;
            
            if (field === 'numHeaders') {
                input.addEventListener('change', (e) => {
                    this.updateHeadersCount(endpointIndex, parseInt(e.target.value));
                });
            } else if (field === 'method') {
                input.addEventListener('change', (e) => {
                    this.state.endpoints[endpointIndex][field] = e.target.value;
                    this.renderEndpoints();
                    this.updateGeneratedScript();
                });
            } else {
                input.addEventListener('input', (e) => {
                    let value = e.target.value;
                    if (field === 'expectedStatus') {
                        value = parseInt(value) || 200;
                    }
                    this.state.endpoints[endpointIndex][field] = value;
                    this.updateGeneratedScript();
                });
            }
        });

        // Header field events
        endpointDiv.querySelectorAll('[data-header-index]').forEach(input => {
            if (!input.matches('.header-select-checkbox, .header-delete-btn')) {
                input.addEventListener('input', (e) => {
                    this.handleHeaderFieldChange(e);
                });
                input.addEventListener('change', (e) => {
                    this.handleHeaderFieldChange(e);
                });
            }
        });
    }

    bindHeaderSelectionEvents(endpointDiv, endpointIndex) {
        // Select all headers checkbox
        const selectAllHeaders = endpointDiv.querySelector('.select-all-headers');
        if (selectAllHeaders) {
            selectAllHeaders.addEventListener('change', (e) => {
                this.toggleSelectAllHeaders(endpointIndex, e.target.checked);
            });
        }

        // Individual header checkboxes
        endpointDiv.querySelectorAll('.header-select-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const headerIndex = parseInt(e.target.dataset.headerIndex);
                this.toggleHeaderSelection(endpointIndex, headerIndex, e.target.checked);
            });
        });

        // Header delete buttons
        endpointDiv.querySelectorAll('.header-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const headerIndex = parseInt(e.target.dataset.headerIndex);
                this.deleteHeader(endpointIndex, headerIndex);
            });
        });

        // Delete selected headers button
        const deleteSelectedBtn = endpointDiv.querySelector('[data-action="delete-selected-headers"]');
        if (deleteSelectedBtn) {
            deleteSelectedBtn.addEventListener('click', (e) => {
                this.bulkDeleteHeaders(endpointIndex);
            });
        }
    }

    toggleEndpointSelection(endpointId, selected) {
        const endpoint = this.state.endpoints.find(e => e.id === endpointId);
        if (endpoint) {
            endpoint.selected = selected;
            this.updateSelectionCounts();
            this.renderEndpoints();
        }
    }

    toggleSelectAllEndpoints(selectAll) {
        this.state.endpoints.forEach(endpoint => {
            endpoint.selected = selectAll;
        });
        this.selectionState.endpoints.selectAll = selectAll;
        this.updateSelectionCounts();
        this.renderEndpoints();
    }

    toggleHeaderSelection(endpointIndex, headerIndex, selected) {
        const endpoint = this.state.endpoints[endpointIndex];
        if (endpoint && endpoint.headers[headerIndex]) {
            endpoint.headers[headerIndex].selected = selected;
            this.renderEndpoints();
        }
    }

    toggleSelectAllHeaders(endpointIndex, selectAll) {
        const endpoint = this.state.endpoints[endpointIndex];
        if (endpoint) {
            endpoint.headers.forEach(header => {
                header.selected = selectAll;
            });
            this.renderEndpoints();
        }
    }

    deleteEndpoint(endpointId) {
        const endpoint = this.state.endpoints.find(e => e.id === endpointId);
        if (!endpoint) return;

        this.confirmAction(
            'Delete Endpoint',
            `Are you sure you want to delete this endpoint?`,
            () => {
                this.state.endpoints = this.state.endpoints.filter(e => e.id !== endpointId);
                document.getElementById('numEndpoints').value = this.state.endpoints.length;
                this.renderEndpoints();
                this.updateGeneratedScript();
                this.updateSelectionCounts();
                this.updateSectionTitles();
                this.showToast('Endpoint deleted successfully', 'success');
            }
        );
    }

    bulkDeleteEndpoints() {
        const selectedEndpoints = this.state.endpoints.filter(e => e.selected);
        if (selectedEndpoints.length === 0) return;

        this.confirmAction(
            'Delete Selected Endpoints',
            `Are you sure you want to delete ${selectedEndpoints.length} selected endpoint(s)?`,
            () => {
                this.state.endpoints = this.state.endpoints.filter(e => !e.selected);
                document.getElementById('numEndpoints').value = this.state.endpoints.length;
                this.renderEndpoints();
                this.updateGeneratedScript();
                this.updateSelectionCounts();
                this.updateSectionTitles();
                this.showToast(`${selectedEndpoints.length} endpoint(s) deleted successfully`, 'success');
            }
        );
    }

    deleteHeader(endpointIndex, headerIndex) {
        const endpoint = this.state.endpoints[endpointIndex];
        if (!endpoint || !endpoint.headers[headerIndex]) return;

        this.confirmAction(
            'Delete Header',
            `Are you sure you want to delete this header?`,
            () => {
                endpoint.headers.splice(headerIndex, 1);
                this.renderEndpoints();
                this.updateGeneratedScript();
                this.showToast('Header deleted successfully', 'success');
            }
        );
    }

    bulkDeleteHeaders(endpointIndex) {
        const endpoint = this.state.endpoints[endpointIndex];
        if (!endpoint) return;

        const selectedHeaders = endpoint.headers.filter(h => h.selected);
        if (selectedHeaders.length === 0) return;

        this.confirmAction(
            'Delete Selected Headers',
            `Are you sure you want to delete ${selectedHeaders.length} selected header(s)?`,
            () => {
                endpoint.headers = endpoint.headers.filter(h => !h.selected);
                this.renderEndpoints();
                this.updateGeneratedScript();
                this.showToast(`${selectedHeaders.length} header(s) deleted successfully`, 'success');
            }
        );
    }

    handleHeaderFieldChange(e) {
        const endpointIndex = parseInt(e.target.dataset.endpointIndex);
        const headerIndex = parseInt(e.target.dataset.headerIndex);
        const field = e.target.dataset.field;
        const value = e.target.value;

        if (!this.state.endpoints[endpointIndex] || !this.state.endpoints[endpointIndex].headers[headerIndex]) {
            return;
        }

        const header = this.state.endpoints[endpointIndex].headers[headerIndex];
        
        if (field === 'mode') {
            header.mode = value;
            if (value === 'Use') {
                header.key = '';
                header.value = '';
            }
            this.renderEndpoints();
        } else if (field === 'selectedVar') {
            // In "Use" mode, do not overwrite key/value fields.
            // Just track the selected variable and show placeholders via render.
            header.selectedVar = value;
            this.renderEndpoints();
        } else {
            header[field] = value;
            
            if (header.mode === 'Store' && header.varName && header.key && header.value) {
                this.upsertStoredVariable(header.varName, header.key, header.value);
            }
        }
        
        this.updateGeneratedScript();
    }

    updateHeadersCount(endpointIndex, count) {
        const endpoint = this.state.endpoints[endpointIndex];
        if (!endpoint) return;
        
        while (endpoint.headers.length < count) {
            endpoint.headers.push({
                id: ++this.idCounters.header,
                key: '',
                value: '',
                mode: 'Manual',
                varName: '',
                selectedVar: '',
                selected: false
            });
        }
        
        if (endpoint.headers.length > count) {
            endpoint.headers = endpoint.headers.slice(0, count);
        }
        
        this.renderEndpoints();
        this.updateGeneratedScript();
    }

    toggleEndpoint(index) {
        if (this.state.endpoints[index]) {
            this.state.endpoints[index].collapsed = !this.state.endpoints[index].collapsed;
            this.renderEndpoints();
        }
    }

    updateStoredVariablesDisplay() {
        const container = document.getElementById('storedVariables');
        
        if (Object.keys(this.state.storedVariables).length === 0) {
            container.innerHTML = '<em>No variables stored yet</em>';
            return;
        }
        
        let html = '';
        for (const [varName, data] of Object.entries(this.state.storedVariables)) {
            html += `<div class="variable-item"><strong>${varName}:</strong> ${data.key} = "${data.value}"</div>`;
        }
        
        container.innerHTML = html;
    }

    // Ensure only one stored variable exists per unique key+value pair.
    // If the same pair exists under a different name, rename it and update references.
    upsertStoredVariable(varName, key, value) {
        if (!varName || !key || !value) return;
        // Find existing entry with same key+value
        let existingName = null;
        for (const [name, data] of Object.entries(this.state.storedVariables)) {
            if (data.key === key && data.value === value) {
                existingName = name;
                break;
            }
        }
        if (existingName && existingName !== varName) {
            // Rename: remove old, set new
            delete this.state.storedVariables[existingName];
            this.state.storedVariables[varName] = { key, value };
            // Update any headers referencing the old name
            this.state.endpoints.forEach(endpoint => {
                endpoint.headers.forEach(h => {
                    if (h.selectedVar === existingName) {
                        h.selectedVar = varName;
                    }
                });
            });
        } else {
            // Simple upsert
            this.state.storedVariables[varName] = { key, value };
        }
    }

    // Selection and UI Updates
    updateSelectionCounts() {
        // Update stage selection count
        const selectedStages = this.state.stages.filter(s => s.selected).length;
        const totalStages = this.state.stages.length;
        document.getElementById('stageSelectionCount').textContent = `${selectedStages} of ${totalStages} selected`;
        document.getElementById('selectAllStages').checked = selectedStages === totalStages && totalStages > 0;
        document.getElementById('deleteSelectedStages').disabled = selectedStages === 0;

        // Update endpoint selection count
        const selectedEndpoints = this.state.endpoints.filter(e => e.selected).length;
        const totalEndpoints = this.state.endpoints.length;
        document.getElementById('endpointSelectionCount').textContent = `${selectedEndpoints} of ${totalEndpoints} selected`;
        document.getElementById('selectAllEndpoints').checked = selectedEndpoints === totalEndpoints && totalEndpoints > 0;
        document.getElementById('deleteSelectedEndpoints').disabled = selectedEndpoints === 0;
    }

    // Confirmation and Modals
    confirmAction(title, message, callback) {
        this.pendingConfirmation = callback;
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;
        document.getElementById('confirmationModal').classList.remove('hidden');
    }

    executeConfirmedAction() {
        if (this.pendingConfirmation) {
            this.pendingConfirmation();
            this.pendingConfirmation = null;
        }
        this.hideModal();
    }

    hideModal() {
        document.getElementById('confirmationModal').classList.add('hidden');
        this.pendingConfirmation = null;
    }

    // Utility Functions
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showMessage(message, type = 'success') {
        const container = document.getElementById('messageContainer');
        container.textContent = message;
        container.className = `message-container ${type}`;
        
        setTimeout(() => {
            container.classList.add('hidden');
        }, 3000);
    }

    handleKeyboardDelete() {
        const selectedStages = this.state.stages.filter(s => s.selected);
        const selectedEndpoints = this.state.endpoints.filter(e => e.selected);

        if (selectedStages.length > 0) {
            this.bulkDeleteStages();
        } else if (selectedEndpoints.length > 0) {
            this.bulkDeleteEndpoints();
        }
    }

    clearAllData() {
        this.state.stages = [];
        this.state.endpoints = [];
        this.state.storedVariables = {};
        this.state.baseUrl = '';
        this.state.botId = '';
        this.state.environment = '';
        this.state.service = '';
        
        document.getElementById('numStages').value = 0;
        document.getElementById('numEndpoints').value = 0;
        document.getElementById('baseUrl').value = '';
        document.getElementById('botId').value = '';
        document.getElementById('environment').value = '';
        document.getElementById('service').value = '';
        
        this.renderStages();
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
        this.showToast('All data cleared successfully', 'success');
    }

    // Script Generation - Fixed to avoid HTML encoding
    generateK6Script() {
        const lines = [];
        
        lines.push("import http from 'k6/http';");
        lines.push("import { sleep, check } from 'k6';");
        
        // Options
        lines.push("");
        lines.push("export const options = {");
        
        // Build stages array manually to avoid JSON.stringify issues
        const stagesArray = this.state.stages.map(s => `{ duration: '${s.duration}', target: ${s.target} }`);
        lines.push(`  stages: [${stagesArray.join(', ')}],`);
        
        lines.push("  thresholds: {");
        lines.push(`    'http_req_duration': ['${this.state.thresholdDuration}'],`);
        lines.push(`    'http_req_failed': ['${this.state.thresholdError}']`);
        lines.push("  }");
        lines.push("};");
        
        // Base URL
        if (this.state.baseUrl) {
            lines.push("");
            lines.push(`const BASE_URL = '${this.state.baseUrl}';`);
        }
        
        // Bot ID
        if (this.state.botId) {
            lines.push(`const BOT_ID = '${this.state.botId}';`);
        }
        
        // Main function
        lines.push("");
        lines.push("export default function () {");
        
        this.state.endpoints.forEach((endpoint, endpointIndex) => {
            lines.push("");
            lines.push(`  // Endpoint ${endpointIndex + 1}: ${endpoint.method} ${endpoint.path}`);
            
            const headers = {};
            endpoint.headers.forEach(header => {
                if (header.mode === 'Use' && header.selectedVar) {
                    const varData = this.state.storedVariables[header.selectedVar];
                    if (varData && varData.key && varData.value) {
                        headers[varData.key] = varData.value;
                    }
                } else if (header.key && header.value) {
                    headers[header.key] = header.value;
                }
            });
            
            const method = endpoint.method.toLowerCase();
            let path = endpoint.path;
            // Replace hardcoded BotId with ${BOT_ID} in the path if present
            if (this.state.botId && path.includes(this.state.botId)) {
                path = path.replaceAll(this.state.botId, '${BOT_ID}');
            }
            const url = this.state.baseUrl ? `\${BASE_URL}${path}` : path;
            const headersStr = Object.keys(headers).length > 0 ? 
                `{ ${Object.entries(headers).map(([k, v]) => `'${k}': '${v}'`).join(', ')} }` : '{}';
            
            let payload = 'null';
            if ((endpoint.method === 'POST' || endpoint.method === 'PUT') && endpoint.payload) {
                try {
                    JSON.parse(endpoint.payload);
                    payload = endpoint.payload;
                } catch (e) {
                    payload = `"${endpoint.payload.replace(/"/g, '\\"')}"`;
                }
            }
            
            if (method === 'get' || method === 'delete') {
                lines.push(`  let res${endpointIndex + 1} = http.${method}('${url}', { headers: ${headersStr} });`);
            } else {
                lines.push(`  let res${endpointIndex + 1} = http.${method}('${url}', ${payload}, { headers: ${headersStr} });`);
            }
            
            lines.push(`  check(res${endpointIndex + 1}, { 'Endpoint ${endpointIndex + 1} status is ${endpoint.expectedStatus}': (r) => r.status === ${endpoint.expectedStatus} });`);
            lines.push(`  sleep(${this.state.thinkTime});`);
        });
        
        lines.push("}");
        
        return lines.join('\n');
    }

    updateGeneratedScript() {
        if (this.codeEditor) {
            const script = this.generateK6Script();
            this.codeEditor.setValue(script);
        }
    }

    downloadScript() {
        // Use the File System Access API if available (Chromium browsers)
        if (window.showSaveFilePicker) {
            (async () => {
                try {
                    const options = {
                        suggestedName: "provideJsonHere.js",
                        types: [{
                            description: "JavaScript File",
                            accept: { "text/javascript": [".js"] }
                        }]
                    };
                    const handle = await window.showSaveFilePicker(options);
                    const writable = await handle.createWritable();
                    const script = this.generateK6Script();
                    await writable.write(script);
                    await writable.close();
                    this.showMessage("✅ Changes applied! File 'provideJsonHere.js' has been overwritten.", 'success');
                } catch (err) {
                    this.showMessage("❌ File overwrite cancelled or failed.", "error");
                }
            })();
        } else {
            // Fallback: Download as file, user must move it manually
            try {
                const script = this.generateK6Script();
                const blob = new Blob([script], {type: 'text/javascript'});
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'provideJsonHere.js';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.showMessage("✅ Changes applied! File 'provideJsonHere.js' has been downloaded. Please move it to your project folder to overwrite the existing file.", 'success');
            } catch (error) {
                this.showMessage(`⚠️ Failed to save file: ${error.message}`, 'error');
            }
        }
    }

        // FIXED: Load data from ./provideJsonHere.js file
    async loadDataFromProvideJsonHere() {
        try {
            // Import the configuration from ./provideJsonHere.js
            const configModule = await import('./provideJsonHere.js');
            const config = configModule.default || configModule;
            
            console.log('Loading data from ./provideJsonHere.js:', config);
            this.applyConfiguration(config);
            this.showToast('Configuration loaded from ./provideJsonHere.js', 'success');
            
        } catch (error) {
            console.error('Error loading ./provideJsonHere.js:', error);
            // Remove or comment out the next line to suppress the warning toast
            // this.showToast('Could not load ./provideJsonHere.js - using default configuration', 'warning');
            // Fall back to default state if file not found
            this.populateFormFields();
            this.renderAll();
        }
    }


    // Apply configuration to the application state
    applyConfiguration(config) {
        // Reset counters
        this.idCounters = { stage: 0, endpoint: 0, header: 0 };

        // Load basic configuration
        this.state.baseUrl = config.baseUrl || '';
        this.state.environment = config.environment || '';
        this.state.service = config.service || '';
        this.state.thresholdDuration = config.thresholdDuration || 'p(95)<500';
        this.state.thresholdError = config.thresholdError || 'rate<0.05';
        this.state.thinkTime = config.thinkTime || 1;
        this.state.botId = config.botId || '';

        // Load stages with proper IDs
        this.state.stages = (config.stages || []).map(stage => ({
            id: ++this.idCounters.stage,
            duration: stage.duration,
            target: stage.target,
            selected: false
        }));

        if (this.state.stages.length === 0) {
            this.state.stages = [{id: ++this.idCounters.stage, duration: '1m', target: 10, selected: false}];
        }

        // Load endpoints with proper IDs and headers
        this.state.endpoints = (config.endpoints || []).map(endpoint => ({
            id: ++this.idCounters.endpoint,
            method: endpoint.method || 'GET',
            path: endpoint.path || '/',
            headers: (endpoint.headers || []).map(header => ({
                id: ++this.idCounters.header,
                key: header.key,
                value: header.value,
                mode: header.mode || 'Manual',
                varName: header.varName || '',
                selectedVar: header.selectedVar || '',
                selected: false
            })),
            payload: endpoint.payload || '',
            expectedStatus: endpoint.expectedStatus || 200,
            collapsed: false,
            selected: false
        }));

        if (this.state.endpoints.length === 0) {
            this.state.endpoints = [{
                id: ++this.idCounters.endpoint,
                method: 'GET',
                path: '/',
                headers: [],
                payload: '',
                expectedStatus: 200,
                collapsed: false,
                selected: false
            }];
        }

        // Build stored variables from loaded headers and include any parsed storedVariables
        this.state.storedVariables = { ...(config.storedVariables || {}) };
        this.state.endpoints.forEach(endpoint => {
            endpoint.headers.forEach(header => {
                if (header.mode === 'Store' && header.varName && header.key && header.value) {
                    this.state.storedVariables[header.varName] = {
                        key: header.key,
                        value: header.value
                    };
                }
            });
        });

        // Update form fields
        this.populateFormFields();
        this.renderAll();
    }
       // FIXED: Populate all form fields with loaded data
    populateFormFields() {
        document.getElementById('baseUrl').value = this.state.baseUrl;
        document.getElementById('botId').value = this.state.botId; // <-- Add this line
        document.getElementById('environment').value = this.state.environment;
        document.getElementById('service').value = this.state.service;
        document.getElementById('thresholdDuration').value = this.state.thresholdDuration;
        document.getElementById('thresholdError').value = this.state.thresholdError;
        document.getElementById('thinkTime').value = this.state.thinkTime;
        document.getElementById('numStages').value = this.state.stages.length;
        document.getElementById('numEndpoints').value = this.state.endpoints.length;
    }

    renderAll() {
        this.renderStages();
        this.renderEndpoints();
        this.updateGeneratedScript();
        this.updateSelectionCounts();
        this.updateSectionTitles();
    }


    // Load configuration from uploaded file
    async handleFileUpload(file) {
        try {
            const content = await this.readFileContent(file);
            let config;

            if (file.name.endsWith('.json')) {
                config = JSON.parse(content);
            } else if (file.name.endsWith('.js')) {
                config = this.parseK6Script(content);
            } else {
                throw new Error('Unsupported file type. Please upload a .js or .json file.');
            }

            this.state.mode = 'modify'; // <-- Ensure mode is set
            this.applyConfiguration(config);
            this.showToast(`Configuration loaded from ${file.name}`, 'success');

            // Reset file input so user can upload the same file again
            document.getElementById('fileUpload').value = '';

        } catch (error) {
             console.error('Error processing uploaded file:', error);
             this.showToast(`Error loading file: ${error.message}`, 'error');
             document.getElementById('fileUpload').value = ''; // <-- Always reset
        }
    }

    // Read file content as text
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseK6Script(content) {
        // Extract Domain and BotId variable values
        const domainMatch = content.match(/const\s+Domain\s*=\s*'([^']+)'/);
        const Domain = domainMatch ? domainMatch[1] : ''; // <-- ADD THIS LINE
        const botIdMatch = content.match(/const\s+BotId\s*=\s*'([^']+)'/);
        const BotId = botIdMatch ? botIdMatch[1] : '';

        let baseUrl = Domain ? `https://${Domain}` : '';

        // Collect simple string variable assignments for later resolution
        const variableValues = {};
        const varAssignRegex = /(const|let)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(['"])((?:\\.|[^\\])*?)\3\s*;/g;
        let vaMatch;
        while ((vaMatch = varAssignRegex.exec(content)) !== null) {
            const varName = vaMatch[2];
            const varValue = vaMatch[4];
            variableValues[varName] = varValue;
        }

        // Extract stages from options
        let stages = [];
        const stagesMatch = content.match(/stages:\s*\[([\s\S]*?)\]/m);
        if (stagesMatch) {
            const stageRegex = /\{[^}]*duration:\s*'([^']+)',\s*target:\s*(\d+)[^}]*\}/g;
            let m;
            while ((m = stageRegex.exec(stagesMatch[1])) !== null) {
                stages.push({ duration: m[1], target: parseInt(m[2]) });
            }
        }

        // Extract endpoints from group blocks
        let endpoints = [];
        const storedVariables = {};
        const groupRegex = /group\(['"`]([^'"`]+)['"`],\s*function\s*\(\)\s*\{([\s\S]*?)\}\);/g;
        let groupMatch;
        while ((groupMatch = groupRegex.exec(content)) !== null) {
            const groupBody = groupMatch[2];

            // Find the URL assignment inside the group
            const urlAssignMatch = groupBody.match(/const\s+url\s*=\s*['"`]?https?:[^\n;]+/);
            let url = '';
            if (urlAssignMatch) {
                // Evaluate the concatenation
                url = urlAssignMatch[0]
                    .replace(/const\s+url\s*=\s*/, '')
                    .replace(/['"`;]/g, '')
                    .replace(/\+/g, '')
                    .replace(/Domain/g, Domain)
                    .replace(/BotId/g, BotId)
                    .trim();
                // Remove baseUrl to get only the path
                if (url.startsWith('https://' + Domain)) {
                    url = url.replace('https://' + Domain, '');
                }
            }

            // Find http.<method> call in group
            const httpCallRegex = /http\.(get|post|put|delete)\(/;
            const httpMatch = httpCallRegex.exec(groupBody);
            const method = httpMatch ? httpMatch[1].toUpperCase() : 'GET';

            // Find headers assignment
            let headers = [];
            const headersMatch = groupBody.match(/headers\s*:\s*\{([^}]+)\}/);
            if (headersMatch) {
                const headerPairs = headersMatch[1].split(',');
                headers = headerPairs.map(pair => {
                    const parts = pair.split(':');
                    if (parts.length < 2) return null;
                    const k = parts[0].trim().replace(/^['"]|['"]$/g, '');
                    const rawV = parts.slice(1).join(':').trim();
                    const vUnquoted = rawV.replace(/^['"]|['"]$/g, '');

                    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(vUnquoted) && variableValues[vUnquoted] !== undefined) {
                        storedVariables[vUnquoted] = { key: k, value: variableValues[vUnquoted] };
                        return { key: '', value: '', mode: 'Use', varName: '', selectedVar: vUnquoted, selected: false };
                    }

                    const v = vUnquoted;
                    return { key: k, value: v, mode: 'Manual', varName: '', selectedVar: '', selected: false };
                }).filter(Boolean);
            }

            // Expected status
            let expectedStatus = 200;
            const checkMatch = groupBody.match(/check\([^)]+,\s*\{\s*'[^']*status[^']*'\s*:\s*\(r\)\s*=>\s*r\.status\s*===\s*(\d+)/);
            if (checkMatch) {
                expectedStatus = parseInt(checkMatch[1]);
            }

            endpoints.push({
                method,
                path: url || '/',
                headers,
                payload: '',
                expectedStatus
            });
        }

        // Extract thresholds
        const durationMatch = content.match(/'http_req_duration':\s*\['([^']+)'\]/);
        const errorMatch = content.match(/'http_req_failed':\s*\['([^']+)'\]/);

        // Extract thinkTime (use 1 if not found)
        const thinkTimeMatch = content.match(/sleep\((\d+)\)/);
        const thinkTime = thinkTimeMatch ? parseInt(thinkTimeMatch[1]) : 1;

        return {
            baseUrl,
            botId: BotId, // <-- Add this line
            environment: '',
            service: '',
            stages,
            endpoints,
            storedVariables,
            thresholdDuration: durationMatch ? durationMatch[1] : 'p(95)<500',
            thresholdError: errorMatch ? errorMatch[1] : 'rate<0.05',
            thinkTime
        };
    }

    // Add this method to your K6ConfigApp class
    saveScriptToFile(filename = 'provideJsonHere.js') {
        const script = this.generateK6Script();
        const blob = new Blob([script], { type: 'text/javascript' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new K6ConfigApp();
});
document.getElementById('fileUpload').value = '';


