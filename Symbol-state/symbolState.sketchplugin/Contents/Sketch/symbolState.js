function createSelect(items,selectedItemIndex,frame) {
	selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
	var comboBox = [[NSComboBox alloc] initWithFrame:frame];
	[comboBox addItemsWithObjectValues:items];
	[comboBox selectItemAtIndex:selectedItemIndex];

	return comboBox;
}

// create text field
function createField(value,frame) {
	var field = [[NSTextField alloc] initWithFrame:frame];
	[field setStringValue:value];

	return field;
}

// create Label header
function createLabel(text,size,frame) {
	var label = [[NSTextField alloc] initWithFrame:frame];
	[label setStringValue:text];
	[label setFont:[NSFont boldSystemFontOfSize:size]];
	[label setBezeled:false];
	[label setDrawsBackground:false];
	[label setEditable:false];
	[label setSelectable:false];

	return label;
}


// create text description
function createDescription(text,size,frame) {
	var label = [[NSTextField alloc] initWithFrame:frame];
	[label setStringValue:text];
	[label setFont:[NSFont systemFontOfSize:size]];
	[label setTextColor:[NSColor colorWithCalibratedRed:(0/255) green:(0/255) blue:(0/255) alpha:0.6]];
	[label setBezeled:false];
	[label setDrawsBackground:false];
	[label setEditable:false];
	[label setSelectable:false];

	return label;
}


function setKeyOrder(alert,order) {
	for (var i = 0; i < order.length; i++) {
		var thisItem = order[i];
		var nextItem = order[i+1];

		if (nextItem) thisItem.setNextKeyView(nextItem);
	}

	alert.alert().window().setInitialFirstResponder(order[0]);
}


function getLayoutSettings(context,type,stateArray) {
	// Document variables
    log("heree")
	var page = context.document.currentPage();
	// Setting variables
	var defaultSettings = {};
	defaultSettings.groupDepth = 1;
	defaultSettings.displayTitles = 0;
	defaultSettings.sortDirection = 0;
	defaultSettings.xPad = '100';
	defaultSettings.yPad = '100';
	defaultSettings.maxPer = '';
	defaultSettings.reverseOrder = 0;
	defaultSettings.renameSymbols = 0;
	defaultSettings.gatherSymbols = 0;
	defaultSettings.removeSymbols = 0;


	// If type is set and equal to "config", operate in config mode...
		// Establish the alert window
		var alertWindow = COSAlertWindow.new();
        alertWindow.setMessageText("Symbol State Plugin");

		// Grouping options
		var groupFrame = NSView.alloc().initWithFrame(NSMakeRect(0,0,300,124));
		alertWindow.addAccessoryView(groupFrame);

		var groupGranularityLabel = createLabel('Create Symbole State',12,NSMakeRect(0,108,140,16));
		groupFrame.addSubview(groupGranularityLabel);

		var groupGranularityDescription = createDescription('Create States for each symbol by adjusting the overrides and save it with a name then use it where ever you want',11,NSMakeRect(0,62,300,42));
		groupFrame.addSubview(groupGranularityDescription);
        log(type)
        if (type == "getStates" || type == "deleteState"){
	    	var groupGranularityValue = createSelect(stateArray,0,NSMakeRect(0,26,250,28));
	    	groupFrame.addSubview(groupGranularityValue);
        } else if (type == "setState"){
            var layoutMaxValue = createField("",NSMakeRect(0,26,250,22));
		    groupFrame.addSubview(layoutMaxValue);
        }
		// Buttons
		alertWindow.addButtonWithTitle('OK');
		alertWindow.addButtonWithTitle('Cancel');

		// Set key order and first responder
		setKeyOrder(alertWindow,[
			groupGranularityValue
            
		]);

		var responseCode = alertWindow.runModal();
        log(responseCode)
        if (responseCode == 1000) {
            if (type == "getStates"){
                log(stateArray[[groupGranularityValue indexOfSelectedItem]])
                setStateToSymbole(context,stateArray[[groupGranularityValue indexOfSelectedItem]])
            }
            else if(type == "deleteState"){
                deleteStatefromSymbole(context,stateArray[[groupGranularityValue indexOfSelectedItem]])
            }
            else if (type == "setState"){
                var overrides = getCurrentInstance(context);
                addStateToMasterSymboleDocumentData(context,overrides,[layoutMaxValue stringValue])
                log([layoutMaxValue stringValue])
            }
        }
}

function getInstanceOverrides (instance) {
    var NewObj = new Object();
    var parentLayers = instance.symbolMaster().children()
    var instantObjectId = instance.objectID().toString();
    for (var i = 0 ; i< parentLayers.count();i++)
        {
            if (parentLayers[i].class() == MSSymbolInstance)
                {
                    var parentLayersObjectId = parentLayers[i].objectID().toString();
                    var tempNewObj = getInstanceOverrides(parentLayers[i])
                    if (!isEmpty(tempNewObj))
                    {
                        NewObj[parentLayersObjectId] = tempNewObj;
                    }

                    if (parentLayers[i].overrides()) {
                    var _tempParentLayers = new Object();
                    for (var keys in parentLayers[i].overrides())
                    {
                        if(!(!isEmpty(parentLayers[i].overrides()[keys]) && parentLayers[i].overrides()[keys].class() == __NSDictionary0))
                        {
                            _tempParentLayers[keys] = parentLayers[i].overrides()[keys]
                            
                        } 
                    }

                    if ( NewObj[parentLayersObjectId] == undefined)
                        {
                            NewObj[parentLayersObjectId] = _tempParentLayers
                        }
                    else {
                            NewObj[parentLayersObjectId] = merge_options(NewObj[parentLayersObjectId],_tempParentLayers)
                        }
                    }   
                } 
        }
    return NewObj;
}


function setStateToSymbole(context,name)
{
    var Parentselectedlayer = context.selection[0].symbolMaster()
    var selection = context.selection[0];
    var overridesStates = context.command.valueForKey_onLayer('state',Parentselectedlayer);
    log(name)
    selection.overrides = overridesStates[name]
}

function deleteStatefromSymbole (context,name)
{
    var Parentselectedlayer = context.selection[0].symbolMaster()
    var overridesStates = context.command.valueForKey_onLayer('state',Parentselectedlayer);
    delete overridesStates[name];
    log(overridesStates)
}

function addStateToMasterSymboleDocumentData(context,override,name)
{
    var docData = context.document.documentData();
    var command = context.command;
    var Parentselectedlayer = context.selection[0].symbolMaster()
    var stateInMaster = command.valueForKey_onLayer('state',Parentselectedlayer)
    if (stateInMaster == null) {
            var state = {}
            state[name] = override;
            command.setValue_forKey_onLayer(state,'state',Parentselectedlayer);
        }
    else  {
            var state = {};
            state[name] = override;
            state = merge_options (state,stateInMaster)
            command.setValue_forKey_onLayer(state,'state',Parentselectedlayer);
            //log (command.valueForKey_onLayer('state',Parentselectedlayer))
        } 

}

function getCurrentInstance(context) {
    var doc = context.document;
    if (context.selection.count() == 0)
        {
            doc.showMessage("No layer selected, Please select symbol instance layer");
        }
    else if (context.selection.count() == 1 && context.selection[0].class() == MSSymbolInstance ) {
            var selection = context.selection[0];
            var newOverrides = merge_options (getInstanceOverrides(context.selection[0]),selection.overrides())
            selection.overrides = newOverrides;
            return newOverrides;
            //AddStateToMasterSymboleDocumentData(newOverrides)
            //doc.showMessage("you symbol State Added 😎 State:[" + context.selection[0].name() + "]" );
    }
    else if (context.selection.count() < 1){  
        doc.showMessage("You are selecting multiple layers, Please select only 1 symbol instance layer that has overrides");
    }
    else {
        doc.showMessage("layer selected doesn't have overrides, Please select only 1 symbol instance layer that has overrides");
    }
    
}


function merge_options(obj1,obj2){
    var obj3 = {};
    for (var attrname in obj1) { 
        obj3[attrname] = obj1[attrname];
    }
    for (var attrname in obj2) { 
        if ( obj3[attrname] == undefined || Object.keys(obj3[attrname]).length === 0)
            { 
                obj3[attrname] = obj2[attrname]; 
            }
        else 
            {
                obj3[attrname] = merge_options(obj3[attrname],obj2[attrname])
            }
    }
    return obj3;
}


function isEmpty(obj){
    if (Object.keys(obj).length === 0 && obj.constructor === Object) {
        return true
    } else {
        return false
    }
}

function getSymbolStates(context) {
    var Parentselectedlayer = context.selection[0].symbolMaster()
    var states = context.command.valueForKey_onLayer('state',Parentselectedlayer);
    if (states){
        var stateValues = Object.keys(states)
        getLayoutSettings(context,"getStates",stateValues)
    } else {
        context.document.showMessage("there is no states saved in this symbol instance" );
    }
}

function deleteSymbolStates(context) {
    var Parentselectedlayer = context.selection[0].symbolMaster()
    var states = context.command.valueForKey_onLayer('state',Parentselectedlayer);
    if (states){
        var stateValues = Object.keys(states)
        getLayoutSettings(context,"deleteState",stateValues)
    } else {
        context.document.showMessage("there is no states saved in this symbol instance" );
    }
}


function setStatus(context)
{
    getLayoutSettings(context,"setState")
}
