import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ICommandPalette,
    showDialog,
    Dialog
    } from '@jupyterlab/apputils';
import { INotebookTools,
    NotebookActions,
    INotebookTracker
    } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { Widget } from '@lumino/widgets';

 // Useful structure for defining commands to reuse info in menus and commandRegistry
 interface CmdandInfo {
     id: string;
     label: string;
     caption: string;
 }

 /**
 * Tools for initially building table.
 */

class NewDataTableDialogBody extends Widget {
    constructor(){
        super({node:Private.dialogBodyHTML()});
    }
    getValue():string[] {
        let values: string[] = [];
        const captionInfo = this.node.querySelector('textarea');
        if (captionInfo){
            values.push(captionInfo.innerHTML);
        }
        for (const k of this.node.querySelectorAll("input")){
            values.push(k.value);
        }
        return values;
    }
}

class getNameForPandasBody extends Widget {
    constructor(){
        super({node:Private.getNameForPandasHTML()});
    }
    getValue():string {
        const tempinp = this.node.querySelector("input");
        if (tempinp){
            return tempinp.value;
        } else {
            return '';
        }
    }
}

namespace Private {
    export function newTableID(){
        const d = new Date();
        const ID = "it_"+(Math.round(d.getTime()));
        return ID
    }

    export function getNameForPandasHTML():HTMLElement{
        let instructions = 'Provide a name for the new dataframe. It should have no spaces and cannot';
        instructions += ' start with a number.';
        const tempbody = document.createElement('div');
        tempbody.setAttribute('id',"get_name_for_pandas_dlg");
        const tempinstr = document.createElement('H4');
        tempinstr.innerHTML = instructions;
        tempbody.append(tempinstr);
        const tempinp = document.createElement('input');
        tempinp.setAttribute('type','text');
        tempinp.setAttribute('size', '40');
        tempbody.append(tempinp);
        return tempbody;
    }

    export function dialogBodyHTML():HTMLElement{
        const instructions = "Set table size remembering to include enough rows and columns for labels.";
        const fields = ["Table Title (caption)","Number of Rows", "Number of Columns"];
        const fieldlen = [40, 15, 15];
        const fieldtype = ['textarea', 'input', 'input']
        const field_defaults = ["Table _ : ...", "2", "2"];
        const tempbody = document.createElement('div');
        tempbody.setAttribute('id',"input_table_dim_dlg");
        const tempinstr = document.createElement('H4');
        //tempinstr.setAttribute('style','text-align:center;');
        tempinstr.innerHTML = instructions;
        tempbody.append(tempinstr);
        for (let i = 0; i < fieldlen.length;i++){
            const templine=document.createElement('div');
            let inputstr = fields[i]+': ';
            inputstr +='<'+fieldtype[i]+' type="text" size="'+fieldlen[i]+'" value="'+
                        field_defaults[i]+'" ';
            if (fieldtype[i] == 'textarea'){
                inputstr +=' onblur="this.innerHTML=this.value;"';
                inputstr += ' placeholder = "'+field_defaults[i]+'"';
            }
            inputstr += '></'+fieldtype[i]+'>';
            templine.innerHTML=inputstr;
            //templine.setAttribute('style','text-align:center;');
            tempbody.append(templine);
        }
    return tempbody;
    }

    export function input_table_prestr():string {
        let prestr='# If no data table appears in the output of this cell, run the cell to display the table.\n\n';
        prestr+='from IPython.display import HTML\n';
        /*p
        restr+='try:\n';
        prestr+='    import input_table\n';
        prestr+='except (ImportError, FileNotFoundError) as e:\n';
        prestr+='    print("Table editing will not work because `jupyter_datainputtable` module is not installed in python kernel")\n';
        */
        return prestr;
    }

    export function table_actions(ID:string):string{
        let actiontblstr = '<div';
        actiontblstr += ' class = "jp-input_table_actions">';
        actiontblstr += '<p class = "jp-input_table_actions">Actions only work if jupyter-datainputtable extension installed.</p>';
        actiontblstr += '<div class = "jp-input_table_actions_label" style = "display:inline-flex;">Table Actions</div>';
        interface action {
            label: string;
            title: string;
            jp_cmd: string;}
        const actions:(action)[] =[{
            label: 'Edit Data',
            title: 'Start editing the data.',
            jp_cmd: 'EditDataTable:jupyter-inputtable'
        },
        {
            label: 'Data to Pandas...',
            title: 'Create a Panda DataFrame from table.',
            jp_cmd: 'DataToPandas:jupyter-inputtable'
        },
        {
            label: 'Save Table',
            title: 'Save the updated data table.',
            jp_cmd: 'SaveDataTable:jupyter-inputtable'
        }]
        for (const act of actions){
            actiontblstr += '<button class ="jp-Button jp-input_table_actions_btn"';
            actiontblstr += ' style = "margin:4px;text-decoration:red line-through;"';
            actiontblstr += ' data-commandlinker-command="'+act.jp_cmd+'" ';
            actiontblstr += 'data-commandlinker-args=\\\'{"tableID":"'+ID+'"}\\\'';
            actiontblstr += 'title="'+act.title+'">';
            actiontblstr +=  ''+act.label+'</button>';
        }
        actiontblstr+='</div>';
        return actiontblstr;
    }

    export function TableHTMLstr(caption:string,
        nrows: number, ncols: number, ID:string):string {
        const labelClass = "jp-input_table_table_label";
        const dataCellClass="jp-input_table_data_cell";
        let tempstr='<table class="jp-input_table" id="'+ID+'"';
        tempstr += ' style = "min-width:80%;">';
        tempstr += '<caption class="jp-input_table" style = "font-weight:bold;';
        tempstr += 'font-size:1.5em;color:darkkhaki;text-align:left;">'+caption+'</caption><tbody>';
        for(let i = 0; i < nrows; i++){
            tempstr+=' <tr class="jp-input_table r'+i+'">';
            for(let k = 0;k < ncols; k++){
                if (k==0 && i==0){
                    tempstr+='  <th class="jp-input_table r'+i+' c'+k+'"';
                    tempstr += ' style="text-align:left;padding:0px;border-width:1px;border-style:solid;">';
                    tempstr+='<button class="jp-Button jp-input_table_lock_btn" ';
                    tempstr+='data-commandlinker-command="LockLabels:jupyter-inputtable" ';
                    tempstr+= 'data-commandlinker-args=\\\'{"tableID":"'+ID+'"}\\\'';
                    tempstr+= '>';
                    tempstr+='Lock Column and Row Labels</button></th>';
                }
                if (k==0 && i>0){
                    tempstr+='<th class="jp-input_table r'+i+' c'+k+'"';
                    tempstr += ' style="text-align:left;padding:0px;border-width:1px;border-style:solid;">';
                    tempstr+='<textarea class="'+labelClass+'"';
                    tempstr +=' onblur="this.innerHTML=this.value;">';
                    tempstr+=''+(i-1)+'</textarea></th>';
                }
                if (i==0 && k>0){
                    tempstr+='<th class="jp-input_table r'+i+' c'+k+'"';
                    tempstr += ' style="text-align:left;padding:0px;border-width:1px;border-style:solid;">';
                    tempstr+='<textarea class="'+labelClass+'"';
                    tempstr +=' onblur="this.innerHTML=this.value;">';
                    tempstr+='Col_'+(k-1)+'</textarea></th>';
                }
                if (k>0 && i>0){
                    tempstr+='  <td class="jp-input_table r'+i+' c'+k+'"';
                    tempstr += ' style="text-align:left;padding:0px;border-width:1px;border-style:solid;">';
                    tempstr+='<textarea class="'+dataCellClass+'"';
                    tempstr +=' onblur="this.innerHTML=this.value;">';
                    tempstr+='</textarea></td>';
                }
            }
            tempstr+=' </tr>';
        }
        tempstr+='</tbody></table>';
        return tempstr;
    }
}

async function get_table_init_data(){
    const NewDataTableWidg = new NewDataTableDialogBody();
    const buttons = [Dialog.cancelButton(), Dialog.okButton()];
    const result = await showDialog({body: NewDataTableWidg,
                                    buttons: buttons,
                                    hasClose: false});
    return result;
};

async function get_name_for_pandas_df(){
    const GetPdDFWidg = new getNameForPandasBody();
    const buttons = [Dialog.cancelButton(), Dialog.okButton()];
    const result = await showDialog({body: GetPdDFWidg,
                                    buttons: buttons,
                                    hasClose: false});
    return result;
}

/**
* Utility functions
 */

function input_element_to_fixed(element:any){ //actually a DOM element, but TS does not believe it can have .value.
    var tempelem =document.createElement('span');
    tempelem.className=element.className;
    const newText = element.value;
    console.log("The new text for the input area:", newText);
    if (newText){
        tempelem.innerHTML = newText;
    }else{
        tempelem.innerHTML = element.innerHTML;}
    element.replaceWith(tempelem);
}

export function data_cell_to_input_cell(element:Element){
    const tempelem=document.createElement('textarea');
    tempelem.setAttribute('size','4');
    tempelem.setAttribute('onblur','this.innerHTML=this.value;');
    let tempid = element.id;
    if (tempid==null){tempid=''};
    tempelem.id=tempid;
    tempelem.className=element.className;
    tempelem.innerHTML = element.innerHTML;
    element.replaceWith(tempelem);
}

function select_containing_cell(elem:Element){
    //Create a synthetic click in the cell to force selection of the cell containing the table
    var event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
    });
    var cancelled = !elem.dispatchEvent(event);
    if (cancelled) {
    // A handler called preventDefault.
    alert("Something is wrong. Try running the cell that creates this table.");
    }
}

function replaceCellContents(cell:Cell, content:string){
    const cellEditor = cell.editor;
    if (cellEditor) {
        const startPos = {column:0, line:0};
        const endline = cellEditor.lineCount - 1;
        let endPos = {column:0, line:endline};
        const endlinecont = cellEditor.getLine(endline);
        if (endlinecont){
            endPos.column = endlinecont.length;
            }
        cellEditor.setSelection({start:startPos, end: endPos});
        if (cellEditor.replaceSelection){
            cellEditor.replaceSelection(content);
        }
    }
}

/**
 * Initialization data for the jupyter-datainputtable extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
    id: 'jupyter-datainputtable:plugin',
    description: 'Predefined data input tables for Jupyter notebooks',
    autoStart: true,
    requires: [ICommandPalette, INotebookTools, INotebookTracker],
    activate: (app: JupyterFrontEnd,
        palette: ICommandPalette,
        notebookTools: INotebookTools,
        notebookTracker: INotebookTracker
        ) => {
        const {commands} = app;
        const NewDataTable:CmdandInfo = {
            id: 'NewDataTable:jupyter-inputtable',
            label: 'Insert Data Entry Table...',
            caption:'Insert a new Data Entry Table'
        };
        commands.addCommand(NewDataTable.id, {
            label: NewDataTable.label,
            caption: NewDataTable.caption,
            execute: async() => {
                const ID = Private.newTableID()
                console.log('Insert data entry table called.');
                const result = await get_table_init_data();
                console.log("Input Table Params:",result);
                if (result.button.accept && result.value){
                    let toInsertStr = Private.input_table_prestr();
                    toInsertStr += 'display(HTML(\'<div class="jp-input_table">';
                    toInsertStr += Private.table_actions(ID);
                    toInsertStr += Private.TableHTMLstr(result.value[0],
                            (Number(result.value[1])), (Number(result.value[2])),ID);
                    toInsertStr += '</div>\'))';
                    if (notebookTools.selectedCells){
                        // Use first selected cell.
                        const cell = notebookTools.selectedCells[0];
                        if (cell){
                            replaceCellContents(cell, toInsertStr);
                            cell.model.setMetadata("editable", false);
                            cell.model.setMetadata("deletable", false);
                            commands.execute('notebook:run-cell');
                        }
                    } else {
                        window.alert('Please select a cell in a notebook.');
                    }
                }
            }
        });
        palette.addItem({
            command: NewDataTable.id,
            category: 'Jupyter Data Input Table',
            args: { origin: 'from the palette' }
        });
        const LockLabels:CmdandInfo = {
            id: 'LockLabels:jupyter-inputtable',
            label: 'Lock Data Entry Table Labels',
            caption:'Lock Data Entry Table Labels'
        };
        commands.addCommand(LockLabels.id, {
            label: LockLabels.label,
            caption: LockLabels.caption,
            execute: (args:any) => {
                let ID = args['tableID'];
                console.log('Passed TableID:',ID);
                if (!ID) {
                    const cell = notebookTools.selectedCells[0];
                    if (cell){
                        const elem = cell.node.querySelector('table.jp-input_table');
                        if(elem){
                            ID = elem.id;
                        }
                    }
                }
                const parentTable = document.getElementById(ID);
                if (parentTable){
                    const labelinputs = parentTable.querySelectorAll('.jp-input_table_table_label');
                    if (labelinputs){
                        for(var i=0;i<labelinputs.length;i++){
                            input_element_to_fixed(labelinputs[i]);
                        }
                        const lockbtn = parentTable.querySelector('.jp-input_table_lock_btn');
                        if(lockbtn){
                            lockbtn.replaceWith('');
                        }
                    }else{
                        console.log('No label cells found in the input table.')}
                }else{
                    console.log('No table found in LockLabels.')
                }
                console.log('LockLabels command called.')
                commands.execute('SaveDataTable:jupyter-inputtable', {tableID:ID});
            }
        });
        const SaveDataTable:CmdandInfo = {
            id: 'SaveDataTable:jupyter-inputtable',
            label: 'Save Data Table',
            caption:'Saves data table so that it can be recreated by running cell.'
        };
        commands.addCommand(SaveDataTable.id, {
            label: SaveDataTable.label,
            caption: SaveDataTable.caption,
            execute: (args:any) => {
                let ID = args['tableID'];
                console.log('Passed TableID:',ID);
                if (!ID) {
                    const cell = notebookTools.selectedCells[0];
                    if (cell){
                        const elem = cell.node.querySelector('div.jp-input_table');
                        if(elem){
                            const tblelem = elem.querySelector('table.jp-input_table');
                            if (tblelem){
                                ID = tblelem.id;
                            }
                        }
                    }
                }
                const table = document.getElementById(ID);
                if (table){
                    const datainputs = table.querySelectorAll('.jp-input_table_data_cell');
                    if (datainputs){
                        for(var i=0;i<datainputs.length;i++){
                            input_element_to_fixed(datainputs[i]);
                        }
                        let tablecnt = table.innerHTML;
                        let tablestr= Private.input_table_prestr();
                        tablestr+='display(HTML(\'<div class="jp-input_table">';
                        tablestr += Private.table_actions(ID);
                        tablestr+='<table class="jp-input_table" id="'+ID+'"';
                        tablestr += ' style = "min-width:80%;">';
                        const re=/\n/g;
                        const re2=/'/g;
                        tablestr+=tablecnt.replace(re,' ').replace(re2,'\\\'')+'</table>';
                        tablestr += '</div>';
                        tablestr+='\'))';
                        select_containing_cell(table); //force selection of cell containing the table.
                        if (notebookTools.selectedCells){
                            // We will only act on the first selected cell
                            const cell = notebookTools.selectedCells[0];
                            replaceCellContents(cell, tablestr);
                            commands.execute('notebook:run-cell');
                        } else {
                            window.alert('Please select a cell in a notebook.');
                        }
                    }else{
                        console.log('No datacells found in table. Nothing saved.');
                    }
                }else{
                    console.log('No datatable found to save.', ID);
                }
                console.log("SaveDataTable command called.")
            }
        });
        const EditDataTable:CmdandInfo = {
            id: 'EditDataTable:jupyter-inputtable',
            label: 'Start editing the data table.',
            caption:'Makes the data cells in the table editable.'
        };
        commands.addCommand(EditDataTable.id, {
            label: EditDataTable.label,
            caption: EditDataTable.caption,
            execute: (args:any) => {
                let ID = args['tableID'];
                console.log('Passed TableID:',ID);
                if (!ID) {
                    const cell = notebookTools.selectedCells[0];
                    if (cell){
                        const elem = cell.node.querySelector('div.jp-input_table');
                        if(elem){
                            const tblelem = elem.querySelector('table.jp-input_table');
                            if (tblelem){
                                ID = tblelem.id;
                            }
                        }
                    }
                }
                const table = document.getElementById(ID);
                if (table){
                    const datainputs = table.querySelectorAll('.jp-input_table_data_cell');
                    if (datainputs){
                        for(var i=0;i<datainputs.length;i++){
                            data_cell_to_input_cell(datainputs[i]);
                        }
                    }
                }
                console.log('Edit data table command called.');
            }
        });

        const DataToPandas:CmdandInfo = {
            id: 'DataToPandas:jupyter-inputtable',
            label: 'Create a Panda DataFrame from table.',
            caption:'Create a Panda DataFrame from table.'
        };
        commands.addCommand(DataToPandas.id, {
            label: DataToPandas.label,
            caption: DataToPandas.caption,
            execute: async (args:any) => {
                let ID = args['tableID'];
                console.log('Passed TableID:',ID);
                if (!ID) {
                    const cell = notebookTools.selectedCells[0];
                    if (cell){
                        const elem = cell.node.querySelector('div.jp-input_table');
                        if(elem){
                            const tblelem = elem.querySelector('table.jp-input_table');
                            if (tblelem){
                                ID = tblelem.id;
                            }
                        }
                    }
                }
                const table = document.getElementById(ID);
                if (table){
                    // Extract the data see fixpd_makeDF in old js.
                    let rows = table.querySelectorAll('tr');
                    let nrows = rows.length;
                    let ncols = rows[0].querySelectorAll('th').length;
                    let colnames = [];
                    let escnamestr = [];
                    let data = [];
                    //sort data into columns
                    for(let i=1;i<ncols;i++){
                        let classstr='.c'+i;
                        const coli = rows[0].querySelector(classstr);
                        let colname = ''
                        if (coli) {
                            const labelcell = coli.querySelector(
                            ".jp-input_table_table_label");
                            if (labelcell){
                                colname = labelcell.innerHTML;
                            }
                        }
                        colnames[i-1]= colname;
                        escnamestr[i-1] = colnames[i-1].replaceAll(' ','_').replaceAll('(','_')
                        .replaceAll(')','_').replaceAll('/','_').replaceAll('*','_').replaceAll('+','_')
                        .replaceAll('-','_').replaceAll('^','_').replaceAll('$','')
                        .replaceAll('{','_').replaceAll('}','_').replaceAll('[','_').replaceAll(']','_')
                        .replaceAll('=','_').replaceAll('@','_').replaceAll('!','_');
                        let tempcol =[];
                        for (let k=1;k<nrows;k++){
                            classstr = '.r'+k+'.c'+i;
                            let tempdata = '';
                            const temprow = rows[k].querySelector(classstr);
                            if (temprow){
                                const tempcell = temprow.querySelector(".jp-input_table_data_cell");
                                if (tempcell){
                                    tempdata = tempcell.innerHTML;
                                }
                            }
                            tempcol[k-1] = tempdata;
                            const alphare = /[a-zA-Z]/;
                            if (alphare.test(tempcol[k-1])){
                                tempcol[k-1]='\''+tempcol[k-1]+'\'';
                            }
                            if (tempcol[k-1]==''){
                                tempcol[k-1]='np.nan';
                            }
                            const nanre = /np\.nan/i;
                            if(nanre.test(tempcol[k-1])){
                                tempcol[k-1]='np.nan';
                            }
                        }
                        data[i-1]=tempcol;
                    }
                    //get indexes if they are not just numeric
                    let use_indexes = false;
                    let indexes = [];
                    for (let i = 1; i < nrows;i++){
                        let classstr = '.r'+i+' .c0';
                        let tempindex = '';
                        const tempcol0 = table.querySelector(classstr);
                        if (tempcol0){
                            const tempindexlabel = tempcol0.querySelector(".jp-input_table_table_label");
                            if (tempindexlabel){
                                tempindex = tempindexlabel.innerHTML;
                            }
                        }
                        indexes[i-1] = tempindex;
                        if (indexes[i-1] != (i-1).toString()){use_indexes = true;}
                    }
                    // Create the python to create the dataframe.
                    let pythoncode = '# Package Imports. These do nothing if packages already imported.\n';
                    pythoncode += 'import numpy as np\n';
                    pythoncode += 'import pandas as pd\n';
                    pythoncode += '# Define the columns\n'
                    let dataframe_param = "{\""+colnames[0]+"\":"+escnamestr[0]+",\n";
                    for (let i=0;i<(ncols-1);i++){
                        pythoncode += escnamestr[i]+"=["+data[i]+"]\n";
                        if (i>0){dataframe_param +="    \""+colnames[i]+"\":"+escnamestr[i]+",\n";}
                    }
                    dataframe_param +="    }"
                    if (use_indexes){
                        dataframe_param +=", index = [";
                        for (let i = 0; i < indexes.length;i++){
                            dataframe_param += "\""+indexes[i]+"\", ";
                        }
                        dataframe_param += "]";
                    }
                    select_containing_cell(table);
                    // record the cell index and add a cell below
                    let cell = notebookTools.activeCell;
                    let tablecellindex = null;
                    const currentnotebook = notebookTracker.currentWidget;
                    if (currentnotebook){
                        const content = currentnotebook.content;
                        if (content){
                            tablecellindex = content.activeCellIndex;
                            await NotebookActions.insertBelow(content);
                        }
                    }
                    /**
                    * Now get a name for the dataframe using a dialog.
                    */
                    const result = await get_name_for_pandas_df();
                    console.log('pandas name result:', result);
                    if (result.button.accept && result.value){
                        if (!result.value || result.value==''){
                            window.alert('You must provide a valid name for the'+
                            ' dataframe. It may not start with a number nor'+
                            ' contain special characters.')
                        } else {
                            pythoncode += '# Create the DataFrame.\n'
                            pythoncode += result.value + '= pd.DataFrame('+dataframe_param+')\n';
                            pythoncode += '# Print a label and output a summary of the DataFrame.\n'
                            pythoncode += 'print(\'DataFrame '+result.value+':\')\n';
                            pythoncode += result.value;
                            //const currentnotebook = app.shell.currentWidget;
                            //const cell = notebookTools.selectedCells[0];

                            let newActiveIndex = null;
                            if (currentnotebook){
                                const content = currentnotebook.content;
                                if (content){
                                    await NotebookActions.selectBelow(content);
                                    newActiveIndex = content.activeCellIndex;
                                }
                            }
                            console.log('Index of cell with table:',tablecellindex,'. Index of new cell',
                                newActiveIndex);
                            if (tablecellindex!=newActiveIndex){
                                cell = notebookTools.activeCell;
                                if (cell){replaceCellContents(cell, pythoncode);}
                            }
                            // Following two lines should not be necessary, but cell is getting locked.
                            // Typescript compilation error?
                            //cell.model.setMetadata("editable", true);
                            //cell.model.setMetadata("deletable", true);
                            commands.execute('notebook:run-cell');
                            console.log('Current Notebook? ',currentnotebook);
                            //console.log(pythoncode);
                        }
                    }
                }
                console.log('Data to Pandas command called.');
            }
        });
        console.log('JupyterLab extension jupyter-datainputtable is activated!');

    }
};

export default plugin;
