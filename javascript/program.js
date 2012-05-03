var createProgram = function(initialValues) {
  // Required Values
  var memory                    = $(initialValues["memory"] + " [data-address]")
  var input                     = $(initialValues["input"] + " [data-input]")
  var instructionPointerDisplay = $(initialValues["memory"] + " .ip")
  var stackPointerDisplay       = $(initialValues["memory"] + " .sp")
  var bufferPointerDisplay      = $(initialValues["memory"] + " .bp")
  var output                    = $(initialValues["output"])

  // Optional Values
  var startInstruction   = initialValues["startInstruction"]  || 0
  var startBufferPointer = initialValues["bufferPointer"]     || -1
  var startStackPointer  = initialValues["stackPointer"]      || -1
  var stackReversed      = initialValues["reverseStack"]      || false

  var instructionPointer = startInstruction
  var stackPointer       = startStackPointer
  var bufferPointer      = startBufferPointer
  var bufferStart        = startBufferPointer
  var currentInput       = 0

  var instructions = {};
  var program      = {};

  var lastInput = function() {
    return $(input[currentInput - 1]).html()
  }

  var clearHighlights = function() {
    memory.removeClass("highlight")
    memory.removeClass("secondary-highlight")
    input.removeClass("highlight")
    input.removeClass("secondary-highlight")
  }

  var highlight = function() {
    $(memory[instructionPointer]).addClass("highlight");
    $(input[currentInput]).addClass("secondary-highlight")
  }

  var updateIP = function(address) {
    address = parseInt(address, 10)
    instructionPointer = address
    instructionPointerDisplay.html(address)
  }

  var push = function(value) {
    stackReversed ? stackPointer -= 1 : stackPointer += 1
    $(memory[stackPointer]).html(value)
    updateSP()
  }

  var getInstructionToken = function(offset) {
    offset = offset || 0
    return $(memory[instructionPointer + offset]).html()
  }

  var performInstruction = function(instruction) {
    if(instructions[instruction] == null){
      program.reset()
    } else {
      instructions[instruction].perform()
    }
  }

  var secondaryHighlightByte = function(address) {
    $(memory[address]).addClass("secondary-highlight")
  }

  var clearStack = function() {
    if(stackReversed) {
      for(var i = startStackPointer; i >= stackPointer; i--) {
        $(memory[i]).html("")
      }
    } else {
      for(var i = startStackPointer; i <= stackPointer; i++) {
        $(memory[i]).html("")
      }
    }
  }

  var clearBuffer = function() {
    if(bufferPointer >= 0) {
      for(var i = bufferStart; i < bufferPointer; i++) {
        $(memory[i]).html("")
      }
    }
  }

  var getInstruction = function(offset) {
    return instructions[getInstructionToken(offset)]
  }

  var pop = function() {
    var value = $(memory[stackPointer]).html()
    $(memory[stackPointer]).html("")
    stackReversed ? stackPointer += 1 : stackPointer -= 1
    updateSP()
    return value;
  }

  var updateSP = function() {
    stackPointerDisplay.html(stackPointer)
  }

  var getNextInput = function() {
    var inputValue = $(input[currentInput]).html()
    currentInput += 1
    return inputValue;
  }

  var updateBuffer = function() {
    bufferPointerDisplay.html(bufferPointer)
  }

  instructions.R = {
    perform: function() {
      push(getNextInput())
      secondaryHighlightByte(stackPointer)
      updateIP(instructionPointer + this.size)
    },
    size: 1
  }

  instructions.G = {
    perform: function() {
      var inputValue = $(memory[instructionPointer + 1]).html()
      updateIP(inputValue)
    },
    size: 2
  }

  instructions.P = {
    perform: function() {
      outputValue = $(memory[instructionPointer + 1]).html()
      output.append($("<span>").html(outputValue))
      updateIP(instructionPointer + this.size)
    },
    size: 2
  }

  instructions.S = {
    perform: function() {
      var instructionSize = getInstruction(1).size
      push(instructionPointer + instructionSize + this.size)
      updateIP(instructionPointer + this.size)
    },
    size: 1
  }

  instructions.F = {
    perform: function() {
      var address = parseInt(pop(), 10)
      updateIP(address)
    },
    size: 1
  }

  instructions.B = {
    perform: function() {
      bufferStart   = stackPointer - 5
      bufferPointer = stackPointer - 5
      updateBuffer()
      updateIP(instructionPointer + this.size)
    },
    size: 1
  }

  instructions.W = {
    perform: function() {
      $(memory[bufferPointer]).html(getNextInput())
      secondaryHighlightByte(bufferPointer)
      bufferPointer += 1
      updateBuffer()
      updateIP(instructionPointer + this.size)
    },
    size: 1
  }

  instructions.Z = {
    perform: function(){
      if(lastInput() === "0") {
        updateIP(getInstructionToken(1))
      } else {
        updateIP(instructionPointer + this.size)
      }
    },
    size: 2
  }

  program.setInput = function(selector) {
    input = $(initialValues["input"] + " [data-input]")
  }

  program.step = function() {
    clearHighlights();
    highlight();
    performInstruction(getInstructionToken())
  }

  program.reset = function() {
    clearHighlights()
    clearStack()
    clearBuffer()
    updateIP(startInstruction)
    stackPointer = startStackPointer
    bufferPointer = startBufferPointer
    updateSP()
    updateBuffer()
    currentInput = 0
    output.html("")
  }

  program.reset()
  return program
}
