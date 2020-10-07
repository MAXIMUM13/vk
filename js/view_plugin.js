// ==UserScript==
// @name         VKChange
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Изменение внешнего вида новой версии ВКонтакте
// @author       MAXIMUM13
// @match        https://vk.com/*
// @require      https://code.jquery.com/jquery-3.5.1.min.js
// @resource     css_float_box    https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/float_box.css
// @resource     css_friends      https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/friends.css
// @resource     css_general      https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/general.css
// @resource     css_groups       https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/groups.css
// @resource     css_im           https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/im.css
// @resource     css_main_page    https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/main_page.css
// @resource     css_news         https://raw.githubusercontent.com/MAXIMUM13/vk/master/resources/css/news.css
// @grant        GM_getResourceText
// ==/UserScript==

(function () {
    'use strict';

    console.log('VKChange');

    const emptyFunction = function () {
    };

    let pageCache = {};

    /**
     * Получить {@code document}-элемент переданного элемента (окна, фрейма).
     */
    function getDocument(el) {
        if (!el) {
            return document;
        }
        if (el.length) {
            el = el[0];
        }
        if ('FRAME' === el.tagName) {
            el = el.contentWindow.document;
        }
        return el;
    }

    function getElement(selector, parent, index) {
        let element = getElements(selector, parent);
        if (element.length) {
            element = $(element[index ? index : 0]);
        }
        return element;
    }

    function getElements(selector, parent) {
        return $(selector, parent);
    }

    function getFunction(func) {
        return typeof (func) === 'function' ? func : emptyFunction;
    }

    function interceptInvokes(func, preInvoke, postInvoke) {
        preInvoke = getFunction(preInvoke);
        postInvoke = getFunction(postInvoke);

        let self = this;
        return function () {
            let args = Array.prototype.slice.call(arguments);

            preInvoke.call(self, func, args);
            let result = func.apply(self, args);
            postInvoke.call(self, func, args, result);

            return result;
        };
    }

    function addGlobalStyle(css) {
        let head = getElement('head');
        if (!head) {
            return;
        }
        let style = $('<style>');
        style.attr('type', 'text/css');
        style.text(css);
        style.appendTo(head);
    }

    function loadStyles() {
        let cssFileNames = [
            'css_float_box',
            'css_friends',
            'css_general',
            'css_groups',
            'css_im',
            'css_main_page',
            'css_news'
        ];
        cssFileNames.forEach((cssFileName) => {
            let stylesText = GM_getResourceText(cssFileName);
            addGlobalStyle(stylesText);
        });
    }

    function initListeners() {
        observeTitleChange();
    }

    function observeTitleChange() {
        let observer = new MutationObserver(function (mutations, observer) {
            observer.disconnect();
            fixMessagesTitle();
            observeTitleChange();
        });

        let titleElement = document.querySelector('head title');
        observer.observe(titleElement, {
            childList: true,
            characterData: true
        });
    }

    function fixMessagesTitle() {
        if (window.location.pathname === '/im') {
            let titleElement = getElement('head title');
            titleElement.text('Сообщения');
        }
    }

    function fixSideBar() {
        let sideBar = getElement('#side_bar');
        let messageButton = getElement('#l_msg', sideBar);
        let labelElement = getElement('.left_label', messageButton);
        labelElement.text('Сообщения');
    }

    function prepareFloatBox() {
        let floatBox = getElement('#rb_box_fc_clist');
        let floatBoxList = getElement('#fc_clist', floatBox);

        let contactsWrap = getElement('.fc_contacts_wrap', floatBoxList);
        contactsWrap.css('height', contactsWrap.css('height'));
        let contactsFilterWrap = getElement('.fc_clist_filter_wrap', floatBoxList);

        let header = getElement('.fc_tab_head', floatBoxList);

        let closeButton = getElement('.fc_tab_close_wrap', header);

        let resizeButton = $('<a>');
        resizeButton.addClass('fc_tab_resize_wrap');
        resizeButton.insertAfter(closeButton);

        let resizeButtonDiv = $('<div>');
        resizeButtonDiv.addClass('chats_sp fc_tab_resize inactive');
        resizeButtonDiv.appendTo(resizeButton);

        let divElements = getElements('div', contactsWrap);
        resizeButton.click(() => {
            let height = contactsWrap.css('height');
            let isCollapsed = height === '0px';
            if (isCollapsed) {
                contactsWrap.css('height', pageCache['fc_contacts_wrap#heigth']);
            } else {
                pageCache['fc_contacts_wrap#heigth'] = height;
                contactsWrap.css('height', '0');
            }
            divElements.each((i, el) => {
                let element = $(el);
                if (isCollapsed) {
                    element.css('height', pageCache['fc_contacts_wrap[' + i + ']#heigth']);
                } else {
                    pageCache['fc_contacts_wrap[' + i + ']#heigth'] = element.css('height');
                    element.css('height', '0');
                }
            });
            contactsFilterWrap.css('display', isCollapsed ? 'block' : 'none');
        });
    }

    function fixFloatBox() {
        setTimeout(function load() {
            let floatBox = getElement('#rb_box_fc_clist');
            if (!floatBox.length) {
                setTimeout(load, 500);
                return false;
            }
            prepareFloatBox();
        }, 500);
    }

    (function main() {
        loadStyles();
        initListeners();
        fixSideBar();
        fixMessagesTitle();
        fixFloatBox();
    })();
})();
