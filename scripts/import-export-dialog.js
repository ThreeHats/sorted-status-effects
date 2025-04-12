// filepath: c:\Users\Noah\Documents\GitHub\sorted-status-effects\scripts\import-export-dialog.js
export class ImportExportDialog extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'import-export-dialog',
            title: 'Import/Export Settings',
            template: 'modules/sorted-status-effects/templates/import-export.html',
            width: 500,
            height: 'auto',
            closeOnSubmit: false,
            submitOnClose: false,
            submitOnChange: false
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Handle export button click
        html.find('#export-button').click(this._handleExport.bind(this));

        // Handle import button click
        html.find('#import-button').click(this._handleImport.bind(this));
    }

    /**
     * Handle exporting settings to JSON
     * @private
     */
    async _handleExport() {
        // Collect all relevant settings
        const settings = {};
        
        // Add sorted status effects
        settings.sortedStatusEffects = game.settings.get('sorted-status-effects', 'sortedStatusEffects') || {};
        
        // Add tags and tag icons
        settings.statusEffectsTags = game.settings.get('sorted-status-effects', 'statusEffectsTags') || [];
        settings.tagIcons = game.settings.get('sorted-status-effects', 'tagIcons') || {};
        
        // Add layout and sidebar settings
        settings.layoutOrientation = game.settings.get('sorted-status-effects', 'layoutOrientation');
        settings.statusHudSidebarMode = game.settings.get('sorted-status-effects', 'statusHudSidebarMode');
        settings.sidebarOpacity = game.settings.get('sorted-status-effects', 'sidebarOpacity');
        
        // If the settings have some of these keys, include them too
        try {
            settings.statusEffectHUDWidth = game.settings.get('sorted-status-effects', 'statusEffectHUDWidth');
        } catch (e) { /* Setting doesn't exist, skip it */ }
        
        try {
            settings.showAboveHud = game.settings.get('sorted-status-effects', 'showAboveHud');
        } catch (e) { /* Setting doesn't exist, skip it */ }
        
        try {
            settings.showAboveMonksLittleDetails = game.settings.get('sorted-status-effects', 'showAboveMonksLittleDetails');
        } catch (e) { /* Setting doesn't exist, skip it */ }

        // Save the data using Foundry's saveDataToFile method
        const filename = `sorted-status-effects-${game.world.id}.json`;
        const jsonData = JSON.stringify(settings, null, 2); // Pretty print with 2 spaces
        
        // Use Foundry's saveDataToFile utility function
        saveDataToFile(jsonData, "text/json", filename);
        ui.notifications.info(`Sorted Status Effects | Settings exported successfully to ${filename}`);
    }

    /**
     * Handle importing settings from a file
     * @private
     */
    async _handleImport() {
        const fileInput = this.element.find('#import-file')[0];
        
        // Check if a file was selected
        if (!fileInput.files.length) {
            ui.notifications.error('Sorted Status Effects | No file selected.');
            return;
        }
        
        // Get the selected file
        const file = fileInput.files[0];
        
        // Check file type
        if (!file.name.endsWith('.json')) {
            ui.notifications.error('Sorted Status Effects | Please select a JSON file.');
            return;
        }
        
        try {
            // Use Foundry's readTextFromFile utility
            const jsonData = await readTextFromFile(file);
            
            // Parse the JSON data
            const settings = JSON.parse(jsonData);
            
            // Confirm with user
            const confirmed = await Dialog.confirm({
                title: 'Confirm Import',
                content: '<p>This will overwrite your current settings. Are you sure you want to proceed?</p>',
                yes: () => true,
                no: () => false,
                defaultYes: false
            });
            
            if (!confirmed) return;
            
            // Import settings
            if (settings.sortedStatusEffects) {
                await game.settings.set('sorted-status-effects', 'sortedStatusEffects', settings.sortedStatusEffects);
            }
            
            if (settings.statusEffectsTags) {
                await game.settings.set('sorted-status-effects', 'statusEffectsTags', settings.statusEffectsTags);
            }
            
            if (settings.tagIcons) {
                await game.settings.set('sorted-status-effects', 'tagIcons', settings.tagIcons);
            }
            
            if (settings.layoutOrientation) {
                await game.settings.set('sorted-status-effects', 'layoutOrientation', settings.layoutOrientation);
            }
            
            if (settings.statusHudSidebarMode) {
                await game.settings.set('sorted-status-effects', 'statusHudSidebarMode', settings.statusHudSidebarMode);
            }
            
            if (settings.sidebarOpacity !== undefined) {
                await game.settings.set('sorted-status-effects', 'sidebarOpacity', settings.sidebarOpacity);
            }
            
            // Import optional settings if they exist
            if (settings.statusEffectHUDWidth !== undefined) {
                try {
                    await game.settings.set('sorted-status-effects', 'statusEffectHUDWidth', settings.statusEffectHUDWidth);
                } catch (e) { /* Setting doesn't exist, skip it */ }
            }
            
            if (settings.showAboveHud !== undefined) {
                try {
                    await game.settings.set('sorted-status-effects', 'showAboveHud', settings.showAboveHud);
                } catch (e) { /* Setting doesn't exist, skip it */ }
            }
            
            if (settings.showAboveMonksLittleDetails !== undefined) {
                try {
                    await game.settings.set('sorted-status-effects', 'showAboveMonksLittleDetails', settings.showAboveMonksLittleDetails);
                } catch (e) { /* Setting doesn't exist, skip it */ }
            }
            
            // Show success notification
            ui.notifications.info('Sorted Status Effects | Settings imported successfully! Please refresh your browser to apply all changes.');
            
            // Close dialog
            this.close();
            
        } catch (error) {
            console.error('Sorted Status Effects | Error importing settings:', error);
            ui.notifications.error('Sorted Status Effects | Failed to import settings. Please check the file format.');
        }
    }
}