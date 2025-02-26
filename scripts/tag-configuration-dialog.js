export class TagConfigurationDialog extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'tag-configuration',
            title: 'Tag Configuration',
            template: 'modules/sorted-status-effects/templates/tag-config.html',
            width: 500,
            height: 'auto',
            closeOnSubmit: true
        });
    }

    getData() {
        const tags = game.settings.get('sorted-status-effects', 'statusEffectsTags') || [];
        const tagIcons = game.settings.get('sorted-status-effects', 'tagIcons') || {};

        if (tags.length === 0 || !tags[0]) {
            return {
                tags: [{ name: '', icon: '' }]
            };
        }
        
        return {
            tags: tags.map(tag => ({
                name: tag,
                icon: tagIcons[tag] || 'icons/svg/d20.svg'
            }))
        };
    }

    async _updateObject(event, formData) {
        const tags = [];
        const tagIcons = {};
        
        // Convert form data to tags and icons
        Object.entries(formData).forEach(([key, value]) => {
            if (key.startsWith('tagName')) {
                const index = key.replace('tagName', '');
                const iconKey = `tagIcon${index}`;
                const tagName = value.trim();
                const iconPath = formData[iconKey]?.trim();
                
                if (tagName) {
                    tags.push(tagName);
                    if (iconPath) {
                        tagIcons[tagName] = iconPath;
                    }
                }
            }
        });

        await game.settings.set('sorted-status-effects', 'statusEffectsTags', tags);
        await game.settings.set('sorted-status-effects', 'tagIcons', tagIcons);
        
        // Force a re-render of any visible token HUDs
        canvas.tokens.placeables.forEach(token => {
            if (token.hasActiveHUD) token.hud.render();
        });
    }
}