var ReactDOM = require('react-dom'),
    debounce = require('lodash.debounce');

var ComponentWidthMixin = {
  getInitialState: function() {
      return {
        componentWidth: null
      };
  },

  componentDidMount: function() {
    window.addEventListener('resize', debounce(this.onResize, 150));
    this.setState({
      componentWidth: ReactDOM.findDOMNode(this).getBoundingClientRect().width
    });
  },

  componentWillUnmount: function() {
    window.removeEventListener('resize', this.onResize);
  },

  onResize: function() {
    this.setState({
      componentWidth: ReactDOM.findDOMNode(this).getBoundingClientRect().width
    });
  }
};
module.exports = ComponentWidthMixin;