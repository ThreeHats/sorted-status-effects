export  function changeHUD(html) {
    console.log('alterHUD called: ', html);
    // Modify the Token HUD to include effect names
    $('#token-hud').toggleClass('sorted-status-effects');
}