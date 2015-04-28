angular.module('angularPayments', []);

angular.module('angularPayments')

.factory('Cards', [function(){

  var defaultFormat = /(\d{1,4})/g;
  var defaultInputFormat =  /(?:^|\s)(\d{4})$/;

  var cards = [
    {
      type: 'jcb',
      pattern: /^35/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'discover',
      pattern: /^(6011|65|64[4-9]|622)/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'mastercard',
      pattern: /^5[1-5]/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [16],
      cvcLength: [3],
      luhn: true
    }, {
      type: 'amex',
      pattern: /^3[47]/,
      format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
      inputFormat: /^(\d{4}|\d{4}\s\d{6})$/,
      length: [15],
      cvcLength: [3, 4],
      luhn: true
    }, {
      type: 'visa',
      pattern: /^4/,
      format: defaultFormat,
      inputFormat: defaultInputFormat,
      length: [13, 14, 15, 16],
      cvcLength: [3],
      luhn: true
    }
  ];

  var _fromNumber = function(num){
      var card, i, len;

      num = (num + '').replace(/\D/g, '');

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];

        if (card.pattern.test(num)) {
          return card;
        }

      }
  }

  var _fromType = function(type) {
      var card, i, len;

      for (i = 0, len = cards.length; i < len; i++) {

        card = cards[i];
        
        if (card.type === type) {
          return card;
        }

      }
  };

  return {
      fromNumber: function(val) { return _fromNumber(val) },
      fromType: function(val) { return _fromType(val) },
      defaultFormat: function() { return defaultFormat;},
      defaultInputFormat: function() { return defaultInputFormat;}
  }

}]);

angular.module('angularPayments')

.factory('_Format',['Cards', '$filter', function(Cards, $filter){

  var _formats = {};

  var _hasTextSelected = function($target) {
      var ref;
      
      if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
          return true;
      }
      
      if (typeof document !== "undefined" && document !== null ? (ref = document.selection) != null ? typeof ref.createRange === "function" ? ref.createRange().text : void 0 : void 0 : void 0) {
          return true;
      }
      
      return false;
    };

  // card formatting

  var _formatCardNumber = function(e) {
      var $target, card, digit, length, re, upperLength, value;
      
      digit = String.fromCharCode(e.which);
      $target = angular.element(e.currentTarget);
      value = $target.val();
      card = Cards.fromNumber(value + digit);
      length = (value.replace(/\D/g, '') + digit).length;
      
      upperLength = 16;
      
      if (card) {
        upperLength = card.length[card.length.length - 1];
      }
      
      if (length >= upperLength) {
        return;
      }

      if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
        e.preventDefault();
        return;
      }

      if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
        return;
      }

      re = Cards.defaultInputFormat();
      if (card) {
          re = card.inputFormat;
      }

      if (re.test(value)) {
        e.preventDefault();
        return $target.val(value + ' ' + digit);

      } else if (re.test(value + digit)) {
        e.preventDefault();
        return $target.val(value + digit + ' ');

      }
  };

  var _restrictCardNumber = function(e) {
      var $target, card, digit, value;
      
      $target = angular.element(e.currentTarget);
      digit = String.fromCharCode(e.which);
      
      if(!/^\d+$/.test(digit)) {
        return;
      }
      
      if(_hasTextSelected($target)) {
        return;
      }
      
      value = ($target.val() + digit).replace(/\D/g, '');
      card = Cards.fromNumber(value);
      
      if(card) {
        if(!(value.length <= card.length[card.length.length - 1])){
          e.preventDefault();
        }
      } else {
        if(!(value.length <= 16)){
          e.preventDefault();
        }
      }
  };

  var _formatBackCardNumber = function(e) {
      var $target, value;
      
      $target = angular.element(e.currentTarget);
      value = $target.val();
      
      if(e.meta) {
        return;
      }
      
      if(e.which !== 8) {
        return;
      }
      
      if(($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
        return;
      }
      
      if(/\d\s$/.test(value) && !e.meta && e.keyCode >= 46) {
        e.preventDefault();
        return $target.val(value.replace(/\d\s$/, ''));
      } else if (/\s\d?$/.test(value)) {
        e.preventDefault();
        return $target.val(value.replace(/\s\d?$/, ''));
      }
    };

  var _getFormattedCardNumber = function(num) {
      var card, groups, upperLength, ref;
      
      card = Cards.fromNumber(num);
      
      if (!card) {
        return num;
      }
      
      upperLength = card.length[card.length.length - 1];
      num = num.replace(/\D/g, '');
      num = num.slice(0, +upperLength + 1 || 9e9);
      
      if(card.format.global) {
        return (ref = num.match(card.format)) != null ? ref.join(' ') : void 0;
      } else {
        groups = card.format.exec(num);
          
        if (groups != null) {
          groups.shift();
        }

        return groups != null ? groups.join(' ') : void 0;
      }
    };

  var _reFormatCardNumber = function(e) {
    return setTimeout(function() {
      var $target, value;
      $target = angular.element(e.target);
    
      value = $target.val();
      value = _getFormattedCardNumber(value);
      return $target.val(value);
    });
  };

  var _parseCardNumber = function(value) {
    return value != null ? value.replace(/\s/g, '') : value;
  };

  _formats['card'] = function(elem, ctrl){
    elem.bind('keypress', _restrictCardNumber);
    elem.bind('keypress', _formatCardNumber);
    elem.bind('keydown', _formatBackCardNumber);
    elem.bind('paste', _reFormatCardNumber);

    ctrl.$parsers.push(_parseCardNumber);
    ctrl.$formatters.push(_getFormattedCardNumber);
  };

  // cvc

  _formatCVC = function(e){
    $target = angular.element(e.currentTarget);
    digit = String.fromCharCode(e.which);
    
    if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
      e.preventDefault();
      return;
    }

    val = $target.val() + digit;
    
    if(val.length <= 4){
      return;
    } else {
      e.preventDefault();
      return;
    }
  };

  _formats['cvc'] = function(elem){
    elem.bind('keypress', _formatCVC)
  };

  return function(type, elem, ctrl){
    if(!_formats[type]){

      types = Object.keys(_formats);

      errstr  = 'Unknown type for formatting: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _formats[type](elem, ctrl);
  }

}])

.directive('paymentsFormat', ['$window', '_Format', function($window, _Format){
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, elem, attr, ctrl){
        _Format(attr.paymentsFormat, elem, ctrl);
      }
    }
}]);

angular.module('angularPayments')

.factory('_Validate', ['Cards', '$parse', function(Cards, $parse){

  var __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }

  var _luhnCheck = function(num) {
    var digit, digits, odd, sum, i, len;

    odd = true;
    sum = 0;
    digits = (num + '').split('').reverse();

    for (i = 0, len = digits.length; i < len; i++) {

      digit = digits[i];
      digit = parseInt(digit, 10);

      if ((odd = !odd)) {
        digit *= 2;
      }

      if (digit > 9) {
        digit -= 9;
      }

      sum += digit;

    }

    return sum % 10 === 0;
  };

  var _validators = {};

  _validators['cvc'] = function(cvc, ctrl, scope, attr){
      var ref, ref1;

      // valid if empty - let ng-required handle empty
      if(cvc == null || cvc.length == 0) return true;

      if (!/^\d+$/.test(cvc)) {
        return false;
      }

      var type;
      if(attr.paymentsTypeModel) {
          var typeModel = $parse(attr.paymentsTypeModel);
          type = typeModel(scope);
      }

      if (type) {
        return ref = cvc.length, __indexOf.call((ref1 = Cards.fromType(type)) != null ? ref1.cvcLength : void 0, ref) >= 0;
      } else {
        return cvc.length >= 3 && cvc.length <= 4;
      }
  };

  _validators['card'] = function(num, ctrl, scope, attr){
      var card, ref, typeModel;

      if(attr.paymentsTypeModel) {
          typeModel = $parse(attr.paymentsTypeModel);
      }

      var clearCard = function(){
          if(typeModel) {
              typeModel.assign(scope, null);
          }
          ctrl.$card = null;
      };

      // valid if empty - let ng-required handle empty
      if(num == null || num.length == 0){
        clearCard();
        return true;
      }

      num = (num + '').replace(/\s+|-/g, '');

      if (!/^\d+$/.test(num)) {
        clearCard();
        return false;
      }

      card = Cards.fromNumber(num);

      if(!card) {
        clearCard();
        return false;
      }

      ctrl.$card = angular.copy(card);

      if(typeModel) {
          typeModel.assign(scope, card.type);
      }

      ret = (ref = num.length, __indexOf.call(card.length, ref) >= 0) && (card.luhn === false || _luhnCheck(num));

      return ret;
  };

  return function(type, val, ctrl, scope, attr){
    if(!_validators[type]){

      types = Object.keys(_validators);

      errstr  = 'Unknown type for validation: "'+type+'". ';
      errstr += 'Should be one of: "'+types.join('", "')+'"';

      throw errstr;
    }
    return _validators[type](val, ctrl, scope, attr);
  }
}])

.factory('_ValidateWatch', ['_Validate', function(_Validate){

    var _validatorWatches = {}

    _validatorWatches['cvc'] = function(type, ctrl, scope, attr){
        if(attr.paymentsTypeModel) {
            scope.$watch(attr.paymentsTypeModel, function(newVal, oldVal) {
                if(newVal != oldVal) {
                    var valid = _Validate(type, ctrl.$modelValue, ctrl, scope, attr);
                    ctrl.$setValidity(type, valid);
                }
            });
        }
    };

    return function(type, ctrl, scope, attr){
        if(_validatorWatches[type]){
            return _validatorWatches[type](type, ctrl, scope, attr);
        }
    }
}])

.directive('paymentsValidate', ['$window', '_Validate', '_ValidateWatch', function($window, _Validate, _ValidateWatch){
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl){

      var type = attr.paymentsValidate;

      _ValidateWatch(type, ctrl, scope, attr);

      var validateFn = function(val) {
          var valid = _Validate(type, val, ctrl, scope, attr);
          ctrl.$setValidity(type, valid);
          return valid ? val : undefined;
      };

      ctrl.$formatters.push(validateFn);
      ctrl.$parsers.push(validateFn);
    }
  }
}]);
