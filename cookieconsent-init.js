// obtain cookieconsent plugin
var cc = initCookieConsent();

// example logo
var logo = '<img src="https://fontmeme.com/permalink/220805/3b90158d204fdd325173a5c7873e7cc1.png" alt="Logo" loading="lazy" style="margin-left: -4px; margin-bottom: -5px; height: 35px">';
var cookie = '🍪';

// run plugin with config object
cc.run({
    languages: "de",
    autoclear_cookies: true,                   // default: false
    cookie_name: 'Hallo_Cookie',             // default: 'cc_cookie'
    cookie_expiration: 0,                    // default: 182
    page_scripts: true,                         // default: false

    // auto_language: null,                     // default: null; could also be 'browser' or 'document'
    // autorun: true,                           // default: true
    // delay: 0,                                // default: 0
    force_consent: true,
    // hide_from_bots: false,                   // default: false
    // remove_cookie_tables: false              // default: false
    // cookie_domain: location.hostname,        // default: current domain
    // cookie_path: "/",                        // default: root
    // cookie_same_site: "Lax",
    // use_rfc_cookie: false,                   // default: false
    // revision: 0,                             // default: 0

    gui_options: {
        consent_modal: {
            layout: 'bar',                      // box,cloud,bar
            position: 'bottom right',           // bottom,middle,top + left,right,center
            transition: 'slide'                 // zoom,slide
        },
        settings_modal: {
            layout: 'bar',                      // box,bar
            // position: 'left',                // right,left (available only if bar layout selected)
            transition: 'slide'                 // zoom,slide
        }
    },

    onFirstAction: function () {
        console.log('onFirstAction fired');
    },

    onAccept: function (cookie) {
        console.log('onAccept fired ...');
    },

    onChange: function (cookie, changed_preferences) {
        console.log('onChange fired ...');
    },

    languages: {
        'en': {
            consent_modal: {
                title: cookie + ' Wir verwenden Cookies! ',
                description: 'Hallo, diese Website verwendet notwendige Cookies, um die Funktionsfähigkeit zu gewährleisten und Tracking Cookies, um zu verstehen, wie Sie mit ihr interagieren. Letztere werden nur nach Ihrer Zustimmung gesetzt. <button type="button" data-cc="c-settings" class="cc-link">Auswahl treffen.</button>',
                primary_btn: {
                    text: 'Alle akzeptieren',
                    role: 'accept_all'              // 'accept_selected' or 'accept_all'
                },
                secondary_btn: {
                    text: 'Alle ablehnen',
                    role: 'accept_necessary'        // 'settings' or 'accept_necessary'
                }
            },
            settings_modal: {
                title: logo,
                save_settings_btn: 'Save settings',
                accept_all_btn: 'Accept all',
                reject_all_btn: 'Reject all',
                close_btn_label: 'Close',
                cookie_table_headers: [
                    { col1: 'Name' },
                    { col2: 'Domain' },
                    { col3: 'Expiration' },
                    { col4: 'Description' }
                ],
                blocks: [
                    {
                        title: 'Verwendung von Cookies 📢',
                        description: 'Ich verwende Cookies, um die grundlegenden Funktionen der Website zu gewährleisten und um Ihr Online-Erlebnis zu verbessern. Sie können für jede Kategorie wählen, ob Sie sich ein- oder austragen möchten. Für weitere Einzelheiten zu Cookies und anderen sensiblen Daten lesen Sie bitte die vollständige  <a href="#datenschutz" class="cc-link">Datenschutzerklärung</a>.'
                    }, {
                        title: 'Notwendige Cookies',
                        description: 'Diese Cookies sind für das ordnungsgemäße Funktionieren meiner Website unerlässlich. Ohne diese Cookies würde die Website nicht richtig funktionieren',
                        toggle: {
                            value: 'necessary',
                            enabled: true,
                            readonly: true          // cookie categories with readonly=true are all treated as "necessary cookies"
                        }
                    }, {
                        title: 'Drittparteien Cookies',
                        description: 'Diese Cookies sammeln Informationen darüber, wie Sie die Website nutzen, welche Seiten Sie besucht und welche Links Sie angeklickt haben. Alle Daten sind anonymisiert und können nicht verwendet werden, um Sie zu identifizieren',
                        toggle: {
                            value: 'targeting',
                            enabled: false,
                            readonly: false
                        }, cookie_table: [
                            {
                                col1: '^_ga',
                                col2: 'google.com',
                                col3: '1/2 Jahr',
                                col4: 'Google Maps Einbindung.',
                                is_regex: true
                            }]
                    }, {
                        title: 'Weitere Informationen',
                        description: 'Bei Fragen zu meiner Politik in Bezug auf Cookies und Ihre Wahlmöglichkeiten, wenden Sie sich bitte an bauer.ludwik@gmail.com',
                    }
                ]
            }
        }
    }

});