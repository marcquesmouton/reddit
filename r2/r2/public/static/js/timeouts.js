/*
  If the current user is 'in timeout', show a modal on restricted actions.

  requires r.config (base.js)
  requires r.access (access.js)
  requires r.ui.Popup (popup.js)
 */
!function(r) {
  // initialized early so click handlers can be bound on declaration
  r.timeouts = {};

  _.extend(r.timeouts, {
    init: function() {
      $('body').on('click', '.access-required', this._handleClick);
      $('.access-required').removeAttr('onclick');

      // special handling for the comment box...
      $('body.comments-page').on('focus', '.usertext.cloneable textarea', function(e) {
        $(this).blur();
        r.timeouts._handleClick(e);
      });
      $('body.comments-page').on('submit', 'form.usertext.cloneable', this._handleClick);
      $('body.comments-page form.usertext.cloneable').removeAttr('onsubmit');

      var isLinkRestricted = r.access.isLinkRestricted;

      r.access.isLinkRestricted = function(el) {
        return r.timeouts.isLinkRestricted(el) || isLinkRestricted(el);
      }
    },

    getPopup: function() {
      // gets the cached popup instance if available, otherwise creates it.
      if (this._popup) { return this._popup; }

      var content = $('#access-popup').html();
      var popup = new r.ui.Popup({
          size: 'large',
          content: content,
          className: 'access-denied-modal',
      });

      popup.$.on('click', '.interstitial .c-btn', this._handleModalClick);
      this._popup = popup;
      return popup;
    },

    _logEvent: function(e) {
      var target = $(e.target);
      var thing = target.thing();

      var targetType = target.data('type') || thing.data('type');
      var targetFullname = target.data('fullname') || thing.data('fullname');
      var actionName = target.data('event-action');
      var actionDetail = target.data('event-detail');

      if (!actionName) {
        actionName = 'modal';
        actionDetail = null;
      }

      r.analytics.event.timeoutForbiddenEvent(actionName, actionDetail, targetType, targetFullname);
    },

    _handleClick: function onClick(e) {
      this.getPopup()
          .show();
      this._logEvent(e);
      return false;
    }.bind(r.timeouts),

    _handleModalClick: function onClick(e) {
      this.getPopup()
          .hide();
      return false;
    }.bind(r.timeouts),

    isLinkRestricted: function(el) {
      return $(el).hasClass('access-required') && r.config.user_in_timeout;
    },
  });

  r.access.initHook(function() {
    if (!r.config.user_in_timeout) { return; }

    r.timeouts.init();
  });
}(r);
