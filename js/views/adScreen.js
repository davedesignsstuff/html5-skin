/********************************************************************
  AD SCREEN
*********************************************************************/
var React = require('react'),
    CONSTANTS = require('../constants/constants'),
    AdPanel = require('../components/adPanel'),
    ControlBar = require('../components/controlBar'),
    ScrubberBar = require('../components/scrubberBar'),
    ClassNames = require('classnames'),
    Utils = require('../components/utils'),
    ResizeMixin = require('../mixins/resizeMixin'),
    Icon = require('../components/icon');

var AdScreen = React.createClass({
  mixins: [ResizeMixin],

  getInitialState: function() {
    this.isMobile = this.props.controller.state.isMobile;
    return {
      controlBarVisible: true,
      timer: null
    };
  },

  componentDidMount: function () {
    //for mobile or desktop fullscreen, hide control bar after 3 seconds
    if (this.isMobile || this.props.fullscreen) {
      this.props.controller.startHideControlBarTimer();
    }
  },

  componentWillUpdate: function(nextProps) {
    if(nextProps) {
      if (nextProps.controller.state.controlBarVisible == false && this.state.controlBarVisible == true) {
        this.hideControlBar();
      }

      if (nextProps.controller.state.controlBarVisible == true && this.state.controlBarVisible == false) {
        this.showControlBar();
      }

      if(!this.props.fullscreen && nextProps.fullscreen && this.state.playerState != CONSTANTS.STATE.PAUSE) {
        this.props.controller.startHideControlBarTimer();
      }
      if(this.props.fullscreen && !nextProps.fullscreen && this.isMobile) {
        this.showControlBar();
        this.props.controller.startHideControlBarTimer();
      }
    }
  },

  componentWillUnmount: function () {
    this.props.controller.cancelTimer();
  },

  handleResize: function() {
    if (this.isMounted()) {
      this.props.controller.startHideControlBarTimer();
    }
  },

  handleClick: function(event) {
    event.stopPropagation(); // W3C
    event.cancelBubble = true; // IE

    this.props.controller.state.accessibilityControlsEnabled = true;
    if ((event.type == 'click' || !this.isMobile) && !this.props.skinConfig.adScreen.showAdMarquee) {
      this.props.controller.onAdsClicked(CONSTANTS.AD_CLICK_SOURCE.VIDEO_WINDOW);
    }
  },

  handlePlayerClicked: function(event) {
    if (event.type == 'touchend' || !this.isMobile) {
      //since mobile would fire both click and touched events,
      //we need to make sure only one actually does the work

      //since after exiting the full screen, iPhone pauses the video and places an overlay play button in the middle
      //of the screen (which we can't remove), clicking the screen would start the video.
      if (Utils.isIPhone() && this.state.playerState == CONSTANTS.STATE.PAUSE) {
        this.props.controller.togglePlayPause();
      }
      else {
        event.stopPropagation(); // W3C
        event.cancelBubble = true; // IE
        this.props.controller.onAdsClicked(CONSTANTS.AD_CLICK_SOURCE.VIDEO_WINDOW);
      }
    }
  },

  showControlBar: function() {
    this.setState({controlBarVisible: true});
    this.props.controller.showControlBar();
  },

  hideControlBar: function(event) {
    if (this.props.controlBarAutoHide == true && !(this.isMobile && event)) {
      this.setState({controlBarVisible: false});
      this.props.controller.hideControlBar();
    }
  },

  handleTouchEnd: function(event) {
    // handleTouchEnd is used to verify controlBar visibility.
    if (!this.state.controlBarVisible && this.props.skinConfig.adScreen.showControlBar) {
      this.showControlBar();
      // Do not start the process to hide the control bar unless we are leaving pause state.
      if (this.props.playerState == CONSTANTS.STATE.PAUSE) {
        this.props.controller.startHideControlBarTimer();
      }
    }
    // Even if our action was to start showing the control bar, we should still handle
    // the click to prevent the need to double tap.
    this.handlePlayerClicked(event);
  },

  handlePlayerMouseMove: function() {
    if(this.props.playerState !== CONSTANTS.STATE.PAUSE && !this.isMobile && this.props.fullscreen) {
      this.showControlBar();
      this.props.controller.startHideControlBarTimer();
    }
  },

  getPlaybackControlItems: function() {
    if (!this.props.controller.state.showAdControls) return null;

    var showControlBar =
      this.props.playerState == CONSTANTS.STATE.PAUSE ||
      this.props.controller.state.forceControlBarVisible ||
      this.state.controlBarVisible;

    var playbackControlItemTemplates = {
     "scrubberBar": <ScrubberBar {...this.props}
       controlBarVisible={showControlBar}
       key='scrubberBar' />,

     "controlBar": <ControlBar {...this.props}
       controlBarVisible={showControlBar}
       playerState={this.props.playerState}
       key='controlBar' />
    };

    var playbackControlItems = [];
    for(var item in playbackControlItemTemplates) {
      playbackControlItems.push(playbackControlItemTemplates[item]);
    }

    return playbackControlItems;
  },

  render: function() {
    var actionIconStyle = {
      color: this.props.skinConfig.pauseScreen.PauseIconStyle.color,
      fontFamily: this.props.skinConfig.icons.pause.fontFamilyName
    };
    var actionIconClass = ClassNames({
      'action-icon-pause': !this.props.controller.state.adPauseAnimationDisabled,
      'action-icon': this.props.controller.state.adPauseAnimationDisabled,
      'animate-pause': !this.props.controller.state.adPauseAnimationDisabled,
      'action-icon-top': this.props.skinConfig.pauseScreen.pauseIconPosition.toLowerCase().indexOf("top") > -1,
      'action-icon-bottom': this.props.skinConfig.pauseScreen.pauseIconPosition.toLowerCase().indexOf("bottom") > -1,
      'action-icon-left': this.props.skinConfig.pauseScreen.pauseIconPosition.toLowerCase().indexOf("left") > -1,
      'action-icon-right': this.props.skinConfig.pauseScreen.pauseIconPosition.toLowerCase().indexOf("right") > -1,
      'hidden': !this.props.skinConfig.pauseScreen.showPauseIcon,
      'icon-hidden': this.props.playerState != CONSTANTS.STATE.PAUSE
    });
    var adPanel = null;
    if (this.props.skinConfig.adScreen.showAdMarquee && this.props.controller.state.showAdMarquee) {
      adPanel = <AdPanel {...this.props} />;
    }
    var playbackControlItems = null;
    if(this.props.skinConfig.adScreen.showControlBar) {
      playbackControlItems = this.getPlaybackControlItems();
    }

    return (
      <div className="state-screen adScreen"
         ref="adScreen"
         onMouseOver={this.showControlBar}
         onMouseOut={this.hideControlBar}
         onMouseMove={this.handlePlayerMouseMove}
         onMouseUp={this.handleClick}>

        <a className={actionIconClass}>
          <Icon {...this.props} icon="pause"/>
        </a>
        <div className="adPanel" ref="adPanel" onClick={this.handlePlayerClicked} onTouchEnd={this.handleTouchEnd}>
          {adPanel}
        </div>
        <div>
          {playbackControlItems}
        </div>

      </div>
    );
  }
});
module.exports = AdScreen;
