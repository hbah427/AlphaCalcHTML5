/**
 * Written by Howie Jordan
 * Copyright (c) 2012 Valley Rocket, LLC
 * Open Source license pending.
 * 
 * Parses any given string into an expression tree that can be easily evaluated by infix traversal of the tree.
 * 
 * The following operations are referred to in the comments with acronyms:
 * PAP = Push As Parent = Pop the stack, set the returned node as this new nodes left child, and push this new node
 * PARC = Push As Right Child = Put the new node as the right child of the top node in the stack.
 * IPARC = Iterative Push As Right Child = PARC, pop the stack and repeat PARC-ing with the returned value. Repeat until you get an open parenthesis or reach the beginning of the expression
 * PUSH refers to simply pushing the new node onto the stack.
 */

// Create a simple ExpressionNode structure, which expects to hold a mathematical operation and links to left and right subnodes.
function ExpressionNode(operation, left, right){
	this.operation = operation;
	this.left = left;
	this.right = right;
	
	this.evaluateExpression = evaluateExpression;
	
	function evaluateExpression(){
		if(typeof this.operation == "number"){
			if(this.right != null){
				return this.operation * this.right.evaluateExpression();
			}
			return this.operation;
		}else{
			if(this.left == null){
				console.log("null");
			}
			return this.operation(this.left, this.right);
		}
	}
}

// Create a Parser based on the given JSON file containing all possible operations and functions.
// functionsListFile should be a string giving the relative file path to JSON file.
function Parser(){
	this.parse = parse;
	this.isValidNumber = isValidNumber;
	this.PAP = PAP;
	this.PARC = PARC;
	this.IPARC = IPARC;
	this.getFunctionFromToken = getFunctionFromToken;
	this.nodeIsOperator = nodeIsOperator;
	this.isOperator = isOperator;
	this.getFunctionFromOperator = getFunctionFromOperator;
	
	// Get the basic mathematical operations from the get-go. These are the only operations which MUST be defined already, somewhere.
	this.add = getFunctionFromToken("add");
	this.subtract = getFunctionFromToken("subtract");
	this.multiply = getFunctionFromToken("multiply");
	this.divide = getFunctionFromToken("divide");
	this.pow = getFunctionFromToken("pow");
	
	function parse(expressionString){
		
		var index = 0;
		var nodeStack = new Array(); // Functions as a stack for purposes of building the tree 
		var listArray = new Array(); // Used to keep track of parameter lists for functions such as min that take multiple parameters
		while(index < expressionString.length){
			var token = expressionString.charAt(index);
			
			if(isValidNumber(token) || token == "."){
				
				//Token is a number. First we ensure that we grab the whole number.
				var nextChar = expressionString.charAt(index + 1);
				while((index < expressionString.length) && (isValidNumber(nextChar) || nextChar == ".")){
					token = token.concat(nextChar);
					index++;
					nextChar = expressionString.charAt(index + 1);
				}
				
				var newNode = new ExpressionNode(parseFloat(token), null, null);
				
				// Check to maintain order of operations
				// Only necessary if both the previous and next nodes are operators
				if(nodeStack.length != 0 && nodeIsOperator(nodeStack[nodeStack.length - 1])){
					if(isOperator(expressionString.charAt(index + 1))){
						var previousOperator = nodeStack[nodeStack.length - 1].operation;
						var nextOperator = expressionString.charAt(index + 1);
						
						// If the nextOperator is of lesser precedence (or less than or equal if the next is division) then PARC instead of just PUSH
						if(previousOperator == pow &&  nextOperator != "^"){
							PARC(nodeStack, newNode);
						}else if((previousOperator == multiply || previousOperator == divide) && (nextOperator != "^")){
							PARC(nodeStack, newNode);
						}else if((previousOperator == divide && (nextOperator == "*" || nextOperator == "/")) || (previousOperator == subtract && (nextOperator == "+" || nextOperator == "-"))){
							PARC(nodeStack, newNode);
						}else{
							nodeStack.push(newNode);
						}
					}else{
						nodeStack.push(newNode);
					}
				}else{
					nodeStack.push(newNode);
				}
			}else if(isOperator(token)){
				var newNode = new ExpressionNode(getFunctionFromOperator(token), null, null);
				PAP(nodeStack, newNode);
			}else if(token == ","){ // Commas indicate that the current function takes multiple parameters
				var newNode = IPARC(stack)
				listArray.push(newNode);
			}else if(token == "("){ // An open-parenthesis is just used as a marker, it should never be evaluated in the tree.
				var newNode = new ExpressionNode("(", null, null);
				nodeStack.push(newNode);
			}else if(token == ")"){ // A close-parenthesis indicates to IPARC back to the last open-paren. If the array isn't empty, then we must be working with a multiparamater taking function (like min)
				var newNode = IPARC(nodeStack);
				if(listArray.length != 0){
					listArray.push(newNode);
					newNode = new ExpressionNode(listArray, null, null);
					listArray = new Array();
				}
				nodeStack.pop(); // Remove the open-paren
				PARC(nodeStack, newNode);
			}else{ // In all other scenarios, assume that the token is going to be a function.
				var nextChar = expressionString.charAt(index + 1);
				// Keep pulling characters until we reach an open-paren, getting the entire function name.
				while(index < expressionString.length && nextChar != "("){
					token = token.concat(nextChar);
					index++;
					nextChar = expressionString.charAt(index + 1);
				}
				
				var newNode = new ExpressionNode(getFunctionFromToken(token), null, null);
				
				// Check to maintain order of operations
				// Only necessary if both the previous and next nodes are operators
				if(nodeStack.length != 0 && nodeIsOperator(nodeStack[nodeStack.length - 1])){
					if(isOperator(expressionString.charAt(index + 1))){
						previousOperator = nodeStack[nodeStack.length - 1].operation;
						nextOperator = expressionString.charAt(index + 1);
						
						// If the nextOperator is of lesser precedence (or less than or equal if the next is division) then PARC instead of just PUSH
						if(previousOperator == pow &&  nextOperator != "^"){
							PARC(nodeStack, newNode);
						}else if((previousOperator == multiply || previousOperator == divide) && (nextOperator != "^")){
							PARC(nodeStack, newNode);
						}else if((previousOperator == divide && (nextOperator == "*" || nextOperator == "/")) || (previousOperator == subtract && (nextOperator == "+" || nextOperator == "-"))){
							PARC(nodeStack, newNode);
						}else{
							nodeStack.push(newNode);
						}
					}else{
						nodeStack.push(newNode);
					}
				}else{
					nodeStack.push(newNode);
				}
			}
			//printStack(nodeStack);
			index++;
		}
		var treeParent = IPARC(nodeStack);
		return treeParent;
	}
	
	function printStack(stack){
		for(node in stack){
			printTree(node);
		}
	}
	
	function printTree(node){
		if(node == null){
			console.log(" NULL ");
			return;
		}
		console.log("( ");
		printTree(node.left);
		console.log(node.operation);
		printTree(node.right);
		console.log(" )");
	}
	
	// Push-As-Parent: Pops the stack, placing the returned node as the left child of the passed node. Pushes the passed node.
	//                 However, whenever the passed node represents a "-" and the previous node is an operator without a right node or is an open parenthesis
	function PAP(stack, nodeToPap){
		var peekedNode = stack[stack.length - 1];
		
		//Special case for a "-" to allow it to also function as additive inverse
		if(nodeToPap.operation === subtract && ((peekedNode == null) || ((nodeIsOperator(peekedNode) && peekedNode.right == null)|| peekedNode.operation == "("))){
			stack.push(nodeToPap);
		}else{
			nodeToPap.left = peekedNode;
			stack.pop();
			stack.push(nodeToPap);
		}
	}
	
	// Push-As-Right-Child: If the node of the top of the stack already has a right node, assume that we should multiply them.
	// Otherwise set the nodeToPARC as the right of the node at the top of the stack.
	function PARC(stack, nodeToParc){
		var peekedNode = stack[stack.length - 1];
		if(peekedNode.right != null){
			var multiplyNode = new ExpressionNode(multiply, peekedNode, nodeToParc);
			stack.pop();
			stack.push(multiplyNode);
		}else{
			peekedNode.right = nodeToParc;
		}
	}
	
	// Iterated-Push-As-Right-Child: Iteratively pops and sets new nodes as right child until either an open-parenthesis or the stack is empty.
	//                               Unlike regular PARC, IPARC returns the final root node of this subtree instead of adding it to the stack. In this way, it can be added to an array instead of pushed, if necessary.
	function IPARC(stack){
		var currentNode = stack.pop()
		var peekedNode = stack[stack.length - 1];
		while(stack.length != 0 && peekedNode.operation != "("){
			var previousNode = stack.pop();
			previousNode.right = currentNode;
			currentNode = previousNode;
			peekedNode = stack[stack.length - 1];
		}
		return currentNode;
	}
	
	function isOperator(token){
		return token == "+" || token == "-" || token == "*" || token == "/" || token == "^";
	}
	
	function getFunctionFromOperator(token){
		switch(token){
			case "+":
				return add;
			case "-":
				return subtract;
			case "*":
				return multiply;
			case "/":
				return divide;
			case "^":
				return pow;
		}
	}
	
	// Check to see if the node's operation is one of the 5 basic ones, i.e. +,-, *,/, or ^
	function nodeIsOperator(node){
		if(node == null){
			return false;
		}
		return node.operation === add || node.operation === subtract || node.operation === multiply || node.operation === divide || node.operation === pow;
	}
	
	function isValidNumber(tokenString){
		return !(isNaN(tokenString));
	}
	
	// Checks that a function with name equal to tokenString exists, if so returns it, else returns undefined
	function getFunctionFromToken(tokenString){
		return window[tokenString];
	}
	
}