var Utils = {};

Utils.makeID = function( str ){
  return str.toLowerCase().replace( " ", "-" );
};

Utils.padString = function( str, len, pad ){
  if( str.length < len ){
    str = new Array( len - str.length + 1 ).join( pad ) + str;
  }
  return str;
};

Utils.stringToRGB = function( str ){
  // match #
  if( str[0] == "#" ){
    return {
      r: parseInt( str.substr( 1, 2 ), 16),
      g: parseInt( str.substr( 3, 2 ), 16),
      b: parseInt( str.substr( 5, 2 ), 16)
    };
  }
  // match rgb()
  var arr = str.split(",");
  return {
    r: parseInt( arr[0].match(/\d+/)[0] ),
    g: parseInt( arr[1] ),
    b: parseInt( arr[2] )
  };
};

Utils.rgbToString = function( rgb ){
  return "#" + Utils.padString( rgb.r.toString(16), 2, "0" ) + Utils.padString( rgb.g.toString(16), 2, "0" ) + Utils.padString( rgb.b.toString(16), 2, "0" );
};

var Tween = {};

Tween.Linear = function() {
  return function( k ){
    return k;
  };
};

var Interpolate = {};

Interpolate.Number = function( start, end, tween ){
  tween = tween ? tween : Tween.Linear();
  return function( k ){
    k = tween( k );
    return start + ( end - start ) * k;
  }
}

Interpolate.Color = function( start, end, tween ){
  tween = tween ? tween : Tween.Linear();
  var s = Utils.stringToRGB( start );
  var e = Utils.stringToRGB( end );
  return function( k ){
    k = tween( k );
    return Utils.rgbToString({
      r: Math.round( s.r + ( e.r - s.r ) * k ),
      g: Math.round( s.g + ( e.g - s.g ) * k ),
      b: Math.round( s.b + ( e.b - s.b ) * k )
    });
  }
}

var UI = {};

// adapted from mrdoob http://mrdoob.com/

UI.Element = function ( dom ) {
  this.dom = dom;
  this.animations = {};
};

UI.Element.prototype = {

  setId: function ( id ) {
    this.dom.id = id;
    return this;
  },

  setClass: function ( name ) {
    this.dom.className = name;
    return this;
  },

  setStyle: function ( style, array ) {
    for ( var i = 0; i < array.length; i ++ ) {
      this.dom.style[ style ] = array[ i ];
    }
  },

  setDisabled: function ( value ) {
    this.dom.disabled = value;
    return this;
  },

  setTextContent: function ( value ) {
    this.dom.textContent = value;
    return this;
  },

  getStyle: function( style ) {
    var value = this.dom.style[ style ];
    var number = parseFloat( value );
    if( number.toString() == value ) return number;
    return value;
  }

}

// properties

var properties = [ 'position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'border', 'borderLeft',
'borderTop', 'borderRight', 'borderBottom', 'borderColor', 'display', 'overflow', 'margin', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'padding', 'paddingLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'color',
'backgroundColor', 'opacity', 'fontSize', 'fontWeight', 'textAlign', 'textDecoration', 'textTransform', 'cursor', 'zIndex', 'float', 'visibility', 'borderRadius' ];

properties.forEach( function ( property ) {

  var setMethod = 'set' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

  UI.Element.prototype[ setMethod ] = function () {
    this.setStyle( property, arguments );
    return this;
  };

  var getMethod = 'get' + property.substr( 0, 1 ).toUpperCase() + property.substr( 1, property.length );

  UI.Element.prototype[ getMethod ] = function () {
    return this.getStyle( property );
  };

} );

UI.Element.prototype.setSelect = function( value ){
  this.dom.style["-webkit-user-select"] = value;
  this.dom.style["-moz-user-select"] = value;
  this.dom.style["-ms-user-select"] = value;
  return this;
}

// events

var events = [ 'KeyUp', 'KeyDown', 'MouseOver', 'MouseOut', 'Click', 'DblClick', 'Change' ];
events.forEach( function ( event ) {

  var method = 'on' + event;

  UI.Element.prototype[ method ] = function ( callback ) {

    this.dom.addEventListener( event.toLowerCase(), callback.bind( this ), false );
    return this;

  };

} );

// animate

// takes options.unit, options.onFinish, options.interpolate, options.property, options.time in ms
// returned value has .cancel() function
UI.Element.prototype.animate = function( options ){

  options.onFinish = options.onFinish ? options.onFinish : function(){};
  options.unit = options.unit ? options.unit : '';

  if( this.animations[ options.property ] ) this.animations[ options.property ].cancel();

  var element = this;

  var startTime = new Date().getTime();

  var cancel = false;

  var step = function(){

    var now = new Date().getTime();

    if( !cancel ){

      var fractionDone = (now - startTime) / options.time;

      if( fractionDone  < 1 ){

        element.dom.style[ options.property ] = options.interpolate( fractionDone ) + options.unit;

        return window.requestAnimationFrame( step );

      }

      element.dom.style[ options.property ] = options.interpolate( 1 ) + options.unit;

      return options.onFinish();

    }

  }

  window.requestAnimationFrame(step);

  this.animations[ options.property ] = {
    cancel: function( newValue ){

      cancel = true;

      if( newValue ) element.setStyle( options.property, newValue );

    }
  }

  return element.animations[ options.property ];

}

// Panel

UI.Panel = function () {

  UI.Element.call( this );
  var dom = document.createElement( 'div' );
  dom.className = 'Panel';
  this.dom = dom;
  return this;

};

UI.Panel.prototype = Object.create( UI.Element.prototype );
UI.Panel.prototype.constructor = UI.Panel;

UI.Panel.prototype.add = function (element) {

  this.dom.appendChild( element.dom );

  return this;

};

UI.Panel.prototype.remove = function (element) {

  this.dom.removeChild( element.dom );

  return this;

};

UI.Panel.prototype.clear = function () {

  while ( this.dom.children.length ) {
    this.dom.removeChild( this.dom.lastChild );
  }

};

UI.Tab = function ( name ) {

  var tab = this;

  UI.Panel.call( this );
  this.setClass( "Tab" );
  this.setTextContent( name ).setSelect( "none" );

  this.inactive = "#999999";
  this.active = "#ecf0f1";

  this.isActive = false;

  this.setColor( this.inactive );

  this.onMouseOver( function(){
    if( !this.isActive ){
      tab.setColor( tab.active );
    }
  });

  this.onMouseOut( function(){
    if( !this.isActive ){
      tab.setColor( tab.inactive );
    }
  });

  return this;

};

UI.Tab.prototype = Object.create( UI.Panel.prototype );
UI.Tab.prototype.constructor = UI.Tab; 

UI.Tab.prototype.makeActive = function(){
  this.isActive = true;
  this.animate({
    interpolate: Interpolate.Color( this.getStyle( "color" ), this.active ),
    property: "color",
    time: 300
  });
};

UI.Tab.prototype.makeInactive = function(){
  this.isActive = false;
  this.animate({
    interpolate: Interpolate.Color( this.getStyle( "color" ), this.inactive ),
    property: "color",
    time: 300
  });
};

UI.Header = function ( text ) {

  UI.Element.call( this );
  var dom = document.createElement( 'h1' );
  dom.className = 'Header';
  this.dom = dom;

  this.setTextContent( text );

  return this;

};

UI.Header.prototype = Object.create( UI.Element.prototype );
UI.Header.prototype.constructor = UI.Header;

UI.Li = function () {

  UI.Element.call( this );
  var dom = document.createElement( 'li' );
  dom.className = 'Li';
  this.dom = dom;

  return this;

};

UI.Li.prototype = Object.create( UI.Element.prototype );
UI.Li.prototype.constructor = UI.Li;

UI.Ul = function ( items ) {

  UI.Element.call( this );
  var dom = document.createElement( 'ul' );
  dom.className = 'Ul';
  this.dom = dom;

  for( var i = 0; i < items.length; i++ ){
    var li = new UI.Li();
    dom.appendChild( li.dom );
    if( typeof items[i] == "string" ){
      li.dom.innerHTML = items[i];
    } else {
      li.dom.innerHTML = items[i].item;
      var ul = new UI.Ul( items[i].items );
      dom.appendChild( ul.dom );
    }
  }

  return this;

};

UI.Ul.prototype = Object.create( UI.Element.prototype );
UI.Ul.prototype.constructor = UI.Ul;

UI.Image = function ( src ) {

  UI.Element.call( this );
  var dom = document.createElement( 'img' );
  dom.className = 'Image';
  this.dom = dom;

  dom.setAttribute( "src", src );

  return this;

};

UI.Image.prototype = Object.create( UI.Element.prototype );
UI.Image.prototype.constructor = UI.Image;

UI.Slide = function ( title ) {

  UI.Panel.call( this );
  this.setClass( "Slide" );

  this.setDisplay( 'none' );
  this.setOpacity( 'none' );

  this.header = new UI.Header( title );
  this.add( this.header );

  this.content = new UI.Panel();
  this.add( this.content );
  return this;

};

UI.Slide.prototype = Object.create( UI.Panel.prototype );
UI.Slide.prototype.constructor = UI.Slide;

UI.Slide.prototype.makeActive = function(){
  this.setDisplay( 'block' );
  this.animate({
    interpolate: Interpolate.Number( this.getStyle( "opacity" ), 1 ),
    property: "opacity",
    time: 500
  });
};

UI.Slide.prototype.makeInactive = function(){

  var slide = this;

  this.animate({
    interpolate: Interpolate.Number( this.getStyle( "opacity" ), 0 ),
    property: "opacity",
    time: 500,
    onFinish: function(){
      slide.setDisplay( 'none' );
    }
  });
};