//
//   Core Framework - Script file
//
//   @license    MIT (https://mit-license.org/)
//   @author     Louis Ouellet <louis@laswitchtech.com>
//

const RelationshipFeed = function(relationships, container, source = null, id = null, callback = null){

    // Create a new div element with the class "row row-cols-3 g-3" to hold the relationship items
    var element = $(document.createElement('div')).attr({
        "class": "row row-cols-3 g-3",
    }).appendTo(container);

    // Add a remove button to the element
    element.controls = $(document.createElement('div')).attr({
        "class": "col-12 d-none",
    }).prependTo(element);
    element.controls.button = $(document.createElement('button')).attr({
        "type": "button",
        "class": "btn btn-danger w-100",
    }).text(builder.Locale.get("Remove")).appendTo(element.controls);
    element.controls.icon = $(document.createElement('i')).addClass("bi bi-dash-lg me-1").prependTo(element.controls.button);

    // Add a click event to the button
    element.controls.button.click(function(){

        // Create a modal
        builder.Component(
            "modal",
            null,
            {
                onEnter: true,
                destroy:true,
                icon: "dash-lg",
                title: builder.Locale.get("Remove a Relationship"),
                cancel: false,
                submit: true,
                size: "lg",
                callback: {
                    submit: function(element,modal){
                        element.form.submit();
                    },
                },
            },
            function(modal,component){

                // Save the component
                const componentModal = component;

                // Style the modal
                component.header.addClass('text-bg-danger');
                component.footer.submit.addClass('btn-danger').removeClass('btn-link').attr({
                    "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
                }).text(builder.Locale.get('Remove'));
                component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-dash-lg me-1').prependTo(component.footer.submit);
                component.form = builder.Component(
                    "form",
                    component.body,
                    {
                        callback:{
                            val: function(values){

                                // Retrieve the source and target by splitting the relationship by "/"
                                var source = values.relationship.split('/')[0];
                                var target = values.relationship.split('/')[1];

                                // Retrieve the source's table and id by splitting the source by ":"
                                var sourceTable = source.split(':')[0];
                                var sourceId = source.split(':')[1];

                                // Retrieve the target's table and id by splitting the target by ":"
                                var targetTable = target.split(':')[0];
                                var targetId = target.split(':')[1];

                                // Convert IDs to integers
                                sourceId = parseInt(sourceId);
                                targetId = parseInt(targetId);

                                // Return the relationship object
                                return {
                                    "sourceTable": sourceTable,
                                    "sourceId": sourceId,
                                    "targetTable": targetTable,
                                    "targetId": targetId,
                                };
                            },
                            submit: function(form){

                                // Retrieve the relationship object
                                var relation = form.val();

                                // AJAX Request
                                $.ajax({
                                    url: '/endpoint.php/relationship/remove',
                                    headers: {'X-CSRF-Authorization': CSRF_KEY},
                                    type: 'POST',dataType: 'json',
                                    data: relation,
                                    success: function(response) {

                                        // Remove the item from the feed
                                        $('[data-type="relationship"][data-table="' + relation.sourceTable + '"][data-id="' + relation.sourceId + '"]').remove();
                                        $('[data-type="relationship"][data-table="' + relation.targetTable + '"][data-id="' + relation.targetId + '"]').remove();

                                        // Remove the options from the select2 field
                                        options = options.filter(function(option){
                                            return option.id != relation.sourceTable + ':' + relation.sourceId + '/' + relation.targetTable + ':' + relation.targetId;
                                        });

                                        // Check if the source is provided
                                        if(options.length > 0){
                                            element.controls.removeClass('d-none');
                                        } else {
                                            element.controls.addClass('d-none');
                                        }

                                        // Execute the callback
                                        if(typeof callback === 'function'){
                                            callback(response);
                                        }

                                        // Close the modal
                                        modal.hide();
                                    }
                                });
                            },
                        },
                    },
                    function(form,component){
                        form.add(
                            {
                                name: 'relationship',
                                label: builder.Locale.get('Relationship'),
                                icon: 'node',
                                type: 'select2',
                                options: options,
                                modal: componentModal,
                            },
                        );

                        // Open the modal
                        modal.show();
                    },
                );
            }
        );
    });

    // Create a dictionary to hold the relationship items
    var items = {};
    var options = [];

    // Create a function to add items to the relationship feed
    element.add = function(table, record){

        // Check if the item already exists in the dictionary
        if(items[table] && items[table][record.id]){
            return;
        }

        // Set the default values for the option
        var option = {
            id: table + ':' + record.id,
            text: table,
        }

        // Check if a source is provided
        if(source){ option.id += '/' + source; }
        if(id){ option.id += ':' + id; }

        // Set the default values for the item
        var meta = {
            "title": "Relationship",
            "description": null,
            "icon": "circle",
            "link": "#",
            "record": record,
            "table": table,
        }

        // Personalize the item based on the table name
        switch(table){
            case "leads":
                if(source == table){
                    meta.title = record.vcard.name;
                    meta.description = builder.Locale.get("Subsidiary - Lead Profile");
                    option.text = meta.title + (meta.title != meta.description ? " | " + meta.description : "");
                    if(id){
                        options.push(option);
                    }
                } else {
                    meta.title = builder.Locale.get("Lead Profile");
                    meta.description = builder.Locale.get("Lead Profile");
                }
                meta.icon = "building-check";
                meta.link = "/plugin/leads/details?id=" + record.id + "&name=" + encodeURIComponent(record.vcard.name);
                break;
            case "clients":
                if(source == table){
                    meta.title = record.vcard.name;
                    meta.description = builder.Locale.get("Subsidiary - Client Profile");
                    option.text = meta.title + (meta.title != meta.description ? " | " + meta.description : "");
                    if(id){
                        options.push(option);
                    }
                } else {
                    meta.title = builder.Locale.get("Client Profile");
                    meta.description = builder.Locale.get("Client Profile");
                }
                meta.icon = "building-fill-check";
                meta.link = "/plugin/clients/details?id=" + record.id + "&name=" + encodeURIComponent(record.vcard.name);
                break;
        }

        // Create a new div element with the class "col" to hold the item
        var item = $(document.createElement('div')).attr({
            "class": "col",
            "data-table": table,
            "data-id": record.id,
            "data-type": "relationship",
        }).appendTo(element);
        item.card = $(document.createElement('a')).attr({
            "class": "card animate-pulse-hover p-3 justify-content-center align-items-center",
            "href": meta.link,
            "title": meta.description,
            "data-bs-title": meta.description,
            "data-bs-toggle": "tooltip",
            "data-bs-placement": "top",
        }).appendTo(item);
        item.tooltip = new bootstrap.Tooltip(item.card[0]);
        item.icon = $(document.createElement('i')).addClass("fs-1 bi bi-" + meta.icon).appendTo(item.card);
        item.title = $(document.createElement('h5')).addClass("m-0 fw-lighter text-center").text(meta.title).appendTo(item.card);

        // Add the item to the dictionary
        items[table] = items[table] || {};
        items[table][record.id] = item;
        items[table][record.id].meta = meta;

        // Check if the source is provided
        if(options.length > 0){
            element.controls.removeClass('d-none');
        } else {
            element.controls.addClass('d-none');
        }
    }

    // Loop through the relationships and add each one to the feed
    for(const [table, records] of Object.entries(relationships)){
        for(const [id, record] of Object.entries(records)){

            // Add the item to the feed
            element.add(table, record);
        }
    }

    // Return
    return element;
}
const RelationshipsCreateWarning = function(callback){

    // Create a modal
    builder.Component(
        "modal",
        null,
        {
            onEnter: true,
            destroy:true,
            icon: "link-45deg",
            title: builder.Locale.get("Link Records"),
            body: builder.Locale.get("Your are about to link the selected records together. Are you sure you want to continue?"),
            cancel: false,
            submit: true,
            callback: {
                submit: function(element,modal){

                    // Execute the callback
                    callback();

                    // Hide the modal
                    modal.hide();
                },
            },
        },
        function(modal,component){

            // Save the component
            const componentModal = component;

            // Style the modal
            component.header.addClass('text-bg-info');
            component.footer.submit.addClass('btn-info').removeClass('btn-link').attr({
                "style": "border-bottom-right-radius: var(--bs-modal-inner-border-radius) !important;border-bottom-left-radius: var(--bs-modal-inner-border-radius) !important;",
            }).text(builder.Locale.get('Link'));
            component.footer.submit.icon = $(document.createElement('i')).addClass('bi bi-link-45deg me-1').prependTo(component.footer.submit);

            // Open the modal
            modal.show();
        }
    );
}
const RelationshipsCreateStart = function(relationships, callback){

    // Create a progress modal
    builder.Component(
        "modal",
        {
            destroy:true,
            submit: false,
            cancel: false,
            icon: "link-45deg",
            title: builder.Locale.get("Progress"),
            static: true,
            size: "lg",
        },
        function(modal,component){

            // Save Modal Component for select2 fields
            const componentModal = component;

            // Styling
            component.header.addClass('text-bg-info');
            component.footer.remove();

            // Create a progress bar
            component.progress = builder.Component(
                'progress',
                component.body,
                {
                    size: '32px',
                    color: 'primary',
                    striped: true,
                    animated: true,
                    scale: relationships.length,
                    label: "{percent} completed {progress} of {scale} relationships created",
                },
                function(progress,component){

                    // Set default value
                    progress.set(0);

                    // Default timeout
                    let timeout = 0;

                    // Loop through the records
                    for(const [key, row] of Object.entries(relationships)){

                        // Add 250 miliseconds to the timeout
                        timeout += 250;

                        // Create a timeout function
                        setTimeout(function(){

                            // Execute the callback
                            callback(row, function(){

                                // Set the value
                                progress.set(progress.get() + 1);

                                // Check if the progress is complete
                                if(progress.get() === relationships.length){

                                    // Update the color of the progress bar
                                    component.bar.removeClass('text-bg-primary').addClass('text-bg-success');

                                    // Timeout to close the modal
                                    setTimeout(function(){

                                        // Close the modal
                                        modal.hide();
                                    }, 1000);
                                }
                            });
                        },timeout);
                    }

                    // Show the modal
                    modal.show();
                },
            );
        }
    );
}
const RelationshipsCreate = function(records, source, callback = null){

    // Initialize the relationships
    var relationships = [];

    // Loop through the records
    for(const [key, current] of Object.entries(records)){

        // Loop through the records
        for(const [k, record] of Object.entries(records)){

            // Skip current record
            if(current.id != record.id){

                // Add a relationship to the array
                relationships.push({
                    "sourceTable": source,
                    "sourceId": current.id,
                    "targetTable": source,
                    "targetId": record.id,
                })
            }
        }
    }

    // Select a user to assign
    RelationshipsCreateWarning(function(){

        // Start the assignment process
        RelationshipsCreateStart(relationships,function(Record,callback){

            // AJAX Request
            $.ajax({
                url: '/endpoint.php/relationship/create',
                headers: {'X-CSRF-Authorization': CSRF_KEY},
                type: 'POST',dataType: 'json',
                data: Record,
                success: function(response) {

                    // Execute the callback
                    callback();
                }
            });
        });
    });
}
