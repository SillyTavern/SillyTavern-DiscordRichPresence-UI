import { eventSource, event_types, getRequestHeaders, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';

let hasPresence = false;

async function setPresence(name = '') {
    return await fetch('/api/discord/update?name=' + encodeURIComponent(name) , {
        method: 'POST',
        headers: getRequestHeaders(),
    });
}

async function onChatChanged() {
    if (!extension_settings.discord.enabled) {
        if (hasPresence) {
            await setPresence();
            hasPresence = false;
        }
        return;
    }

    const context = getContext();
    let name = '';

    if (context.characterId !== undefined && context.characterId !== null) {
        name = context.name2 || '';
    }

    if (context.groupId) {
        name = context.groups.find(g => g.id === context.groupId)?.name || '';
    }

    const result = await setPresence(name);

    if (result.status === 200) {
        hasPresence = true;
        console.log('Discord Rich Presence updated to', name);
    }

    if (result.status === 204) {
        hasPresence = false;
        console.log('Discord Rich Presence reset');
    }

    if (result.status === 404) {
        hasPresence = false;
        toastr.warning('Discord Rich Presence plugin not found. Extension will be disabled.');
        console.log('Discord Rich Presence plugin not found');
        $('#discord_rpc_enabled').prop('checked', false);
        saveSettingsDebounced();
    }
}

jQuery(() => {
    const html = `
    <div class="discord_rpc_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Discord Rich Presence</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <label class="checkbox_label">
                    <input type="checkbox" id="discord_rpc_enabled">
                    Display active character name in Discord
                </label>
                <small>
                    Requires a server plugin to be loaded. Get it <a target="_blank" href="https://github.com/Cohee1207/SillyTavern-DiscordRichPresence-UI">here</a>.
                </small>
            </div>
        </div>
    </div>`;
    $('#extensions_settings2').append(html);

    if (!extension_settings.discord) {
        extension_settings.discord = {
            enabled: false,
        };
        saveSettingsDebounced();
    }

    const $enabled = $('#discord_rpc_enabled');
    $enabled.prop('checked', extension_settings.discord.enabled);
    $enabled.on('change', () => {
        extension_settings.discord.enabled = $enabled.prop('checked');
        onChatChanged();
        saveSettingsDebounced();
    });

    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);
});
