builder.add('widgets','related', class extends builder.ComponentClass {

    _init(){
        this._properties = {
            class: {
                component: null,
            },
            data: {},
            targetTable: null,
            targetId: null,
            interval: 10000,
            autoStart: false,
            callback: {},
        };
        this._relations = {};
        this._counter = 0;
        this._interval = null;
    }

    _create(){

        // Set Self
        const self = this;

        // Create Component
        this._component = $(document.createElement('div')).attr({
            'id': 'related' + this._id,
            'class': 'related-feed',
        });
        this._component.id = this._component.attr('id');

        // Set Component Class
        if(this._properties.class.component){
            this._component.addClass(this._properties.class.component);
        }

        // Create a controls container
        this._component.controls = $(document.createElement('div')).addClass('related-controls').prependTo(this._component);

        // Create view controls
        this._component.controls.group = $(document.createElement('div')).addClass('btn-group').appendTo(this._component.controls);
        this._component.controls.group.grid = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'grid',
            'type': 'button',
        }).html('<i class="bi bi-grid-3x3-gap"></i>').appendTo(this._component.controls.group);
        this._component.controls.group.list = $(document.createElement('button')).attr({
            'class': 'btn btn-outline-secondary',
            'data-action': 'list',
            'type': 'button',
        }).html('<i class="bi bi-list"></i>').appendTo(this._component.controls.group);

        // Create a search container
        this._component.search = $(document.createElement('input')).attr({
            'class': 'form-control',
            'type': 'search',
            'placeholder': this._builder.Locale.get('Search...'),
        }).prependTo(this._component.controls);
        this._component.search.on('input', function(){
            const search = this.value.toLowerCase();
            self._component.container.children('.col').each(function(){
                const content = $(this).text().toLowerCase();
                if(content.includes(search)){
                    $(this).show();
                } else {
                    $(this).hide();
                }
            });
        });

        // Create a container for the related
        this._component.container = $(document.createElement('div')).addClass('related-container').appendTo(this._component);
        this._component.container.on('click', '.controls, .controls *', function (e) {
            e.stopPropagation();
        });

        // Load the state
        this.loadState();

        // Add Event Listeners
        this._component.controls.group.grid.click(function(){

            // Set the grid view
            self._component.container.removeClass('list-view').addClass('grid-view');
            self._component.controls.group.grid.addClass('active');
            self._component.controls.group.list.removeClass('active');

            // Save the state
            self.saveState();
        });
        this._component.controls.group.list.click(function(){

            // Set the list view
            self._component.container.removeClass('grid-view').addClass('list-view');
            self._component.controls.group.list.addClass('active');
            self._component.controls.group.grid.removeClass('active');

            // Save the state
            self.saveState();
        });

        // Add existing Records
        for(const [table, records] of Object.entries(this._properties.data ?? {})){
            for(const [id, record] of Object.entries(records ?? {})){
                this.add(table, record);
            }
        }

        // Check if autoStart is enabled
        if(this._properties.autoStart){

            // Start the interval to check for changes
            setTimeout(function(){
                self.start();
            }, this._properties.interval);
        }
    }

    stateKey() {

        // include origin, path and query so /page?a=1 and /page?a=2 don't clash
        const url = location.origin + location.pathname + location.search;
        return `files.state::${url}::${this._component.id}`;
    }

    clearState() {

        // Remove persisted state
        localStorage.removeItem(this.stateKey());

        // Reset the view mode
        this._component.container.removeClass('list-view').addClass('grid-view');
    }

    saveState() {

        // Save the current view mode
        const state = {
            view: this._component.container.hasClass('list-view') ? 'list' : 'grid',
        };

        // Persist the state
        localStorage.setItem(this.stateKey(), JSON.stringify(state));
    }

    loadState() {

        // Check for persisted state
        const state = localStorage.getItem(this.stateKey());
        if(state){
            try {
                const parsedState = JSON.parse(state);
                if(parsedState.view === 'list'){
                    // Set the list view
                    this._component.container.removeClass('grid-view').addClass('list-view');
                    this._component.controls.group.list.addClass('active');
                    this._component.controls.group.grid.removeClass('active');
                } else {
                    // Set the grid view
                    this._component.container.removeClass('list-view').addClass('grid-view');
                    this._component.controls.group.grid.addClass('active');
                    this._component.controls.group.list.removeClass('active');
                }
            } catch (e) {
                // If parsing fails, default to grid view
                this._component.container.removeClass('list-view').addClass('grid-view');
                this._component.controls.group.grid.addClass('active');
                this._component.controls.group.list.removeClass('active');
            }
        } else {
            // Default to grid view if no state is found
            this._component.container.removeClass('list-view').addClass('grid-view');
            this._component.controls.group.grid.addClass('active');
            this._component.controls.group.list.removeClass('active');
        }
    }

    load(records = null){

        // Set Self
        const self = this;

        // Check if records are provided
        if(records !== null && Object.entries(records).length > 0){

            // Loop through the records
            for(const [table, results] of Object.entries(records)){
                for(const [id, record] of Object.entries(results)){
                    self.add(table,record);
                }
            }
            return this;
        }

        return this;
    }

    start(){
        // Set Self
        const self = this;

        // Check if the interval is already set
        if(this._interval){
            console.warn('Interval is already set, stopping the previous one.');
            clearInterval(this._interval);
        }

        // Set the interval to check for changes
        this._interval = setInterval(function(){
            self.load();
        }, this._properties.interval);
    }

    stop(){
        // Check if the interval is set
        if(this._interval){
            clearInterval(this._interval);
            this._interval = null;
        } else {
            console.warn('No interval is currently set.');
        }
    }

    add(table, record, param1 = null, param2 = null){

        // Set Self
        const self = this;

        let options = {};
        let callback = null;

        // Set selector, options, and callback
        [param1, param2].forEach(param => {
            if(param !== null){
                if (typeof param === 'object') {
                    options = param;
                } else if (typeof param === 'function') {
                    callback = param;
                }
            }
        });

        let properties = {
            class: {},
            callback: {},
        };

        // Configure Options
        for(const [key, value] of Object.entries(options)){
            if(typeof properties[key] !== 'undefined'){
                switch(key){
                    case"callback":
                        if(typeof properties[key] !== 'undefined'){
                            for(const [k, v] of Object.entries(value)){
                                if(typeof properties[key][k] !== 'undefined'){
                                    properties[key][k] = v;
                                }
                            }
                        }
                        break;
                    case"class":
                        for(const [section, classes] of Object.entries(value)){
                            if(properties[key][section] != null){
                                properties[key][section] += ' ' + classes;
                            } else {
                                properties[key][section] = classes;
                            }
                        }
                        break;
                    default:
                        properties[key] = value;
                        break;
                }
            }
        }

        // Check if the file already exists
        if(this._relations[table+':'+record.id ?? (this._counter + 1)]){
            return this;
        }

        // Increment Post Count
        this._counter++;

        // Set ID
        const count = table+':'+record.id ?? this._counter;
        const id = this._component.id + 'relation' + count;

        // Create Column
        let relation = $(document.createElement('div')).attr({
            'id':id,
            'class':'col',
            'data-type':'relation',
        }).appendTo(this._component.container);
        relation.id = relation.attr('id');
        relation.data = record;

        // Create Card
        relation.card = $(document.createElement('div')).attr({
            'class': 'card h-100 card-hover',
            'data-id': count,
        }).appendTo(relation);
        relation.card.body = $(document.createElement('div')).addClass('card-body').appendTo(relation.card);

        // Add vCard information
        relation.card.body.info = $(document.createElement('div')).addClass('d-flex align-items-center gap-3').appendTo(relation.card.body);
        relation.card.body.info.icon = $(document.createElement('div')).addClass('related-icon').appendTo(relation.card.body.info);
        relation.card.body.info.icon.i = $(document.createElement('i')).addClass('bi bi-'+this.icon(table)+' text-'+((table === this._properties.targetTable) ? 'success' : 'primary')).appendTo(relation.card.body.info.icon);
        relation.card.body.info.container = $(document.createElement('div')).addClass('related-info flex-grow-1').appendTo(relation.card.body.info);
        relation.card.body.info.container.name = $(document.createElement('div')).addClass('related-name d-flex align-items-center gap-2 flex-wrap').text(record.vcard.name ?? record.name).appendTo(relation.card.body.info.container);
        relation.card.body.info.container.metadata = $(document.createElement('div')).addClass('small text-secondary').appendTo(relation.card.body.info.container);
        relation.card.body.info.container.metadata.size = $(document.createElement('span')).addClass('related-table').text(table).appendTo(relation.card.body.info.container.metadata);
        relation.card.body.info.container.metadata.date = $(document.createElement('span')).addClass('related-date').text(new Date(record.modified ?? Date.now()).toLocaleDateString()).appendTo(relation.card.body.info.container.metadata);

        // Check if the target table is the same as the current table
        if(table === this._properties.targetTable){

            // Add delete button
            relation.card.delete = $(document.createElement('button')).attr({
                'type': 'button',
                'class': 'btn btn-light',
            }).html('<i class="bi bi-trash"></i>').appendTo(relation.card);
            relation.card.delete.hover(function(){
                $(this).removeClass('btn-light').addClass('btn-danger');
            }, function(){
                $(this).removeClass('btn-danger').addClass('btn-light');
            }).click(function(){
                self.delete(table, record, function(){
                    delete self._relations[count];
                    relation.remove();
                });
            });
        }

        // Add click event to the card
        relation.card.body.click(function(e){
            e.stopPropagation();

            // Check if the record has a link
            if(self.link(table, record) !== '#'){
                // Navigate to the record details
                window.location.href = self.link(table, record);
            }
        });

        // Save the vCard in the contacts object
        this._relations[count] = relation;

        // return the instance
        return this;
    }

    icon(table) {
        switch(table) {
            case 'clients':
            case 'leads': return 'building-check';
            default: return 'question-circle';
        }
    }

    link (table, record) {
        switch(table) {
            case 'clients':
            case 'leads': return '/plugin/'+table+'/details?id=' + record.id;
            default: return '#';
        }
    }

    delete(table, record, callback = null){

        // Set Self
        const self = this;

        // Create the Modal
        this._builder.Component(
            "modal",
            {
                icon: "trash",
                title: this._builder.Locale.get("Are you sure?"),
                body: this._builder.Locale.get("You are about to remove the selected relationship. Are you sure you want to continue?"),
                color: 'danger',
                callback: {
                    submit: function(element,modal){

                        // Show the modal spinner
                        modal.spinner(true);

                        // AJAX Request
                        API.endpoint('/relationship/remove').data({
                            "sourceTable": table,
                            "sourceId": record.id,
                            "targetTable": self._properties.targetTable,
                            "targetId": self._properties.targetId
                        }).execute(function(response){

                            // Check for a callback
                            if(callback && typeof callback === 'function'){
                                callback(response);
                            }

                            // Close the modal
                            modal.hide();
                        },function(xhr, status, error){

                            // Check for a callback
                            if(callback && typeof callback === 'function'){
                                callback(error);
                            }

                            // Close the modal
                            modal.hide();
                        });
                    },
                },
            },
            function(modal,component){

                // Show the modal
                modal.show();
            },
        );
    }
});
