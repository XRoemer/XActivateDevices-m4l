autowatch = 1;
outlets = 1;

// var col_width = 65;
// var col_width2 = 15;


var dic = new Dict("deactivate_devs");
var dic_devs = new Dict("devices");
var dic_maps = new Dict("mappings");
var dic_row_ids = new Dict("row_ids");
var dic_ini_states = new Dict("initial_states");

var this_id = new LiveAPI("this_device").id;
var max_lvl = 0;




function iterateDevices(api)
{
	var count = api.getcount("devices");
	var apiPath = dequotePath(api);	

	var id = api.id

	var x = Number(dic.get(id.toString()+"::lvl")) + 1
	var y = Number(dic.get(id.toString()+"::nr")) 

	for (var i = 0; i < count; i++) {
		var deviceApi = new LiveAPI(apiPath + " devices " + i);
		
		if (deviceApi) {
			try {
				var ddic = new Dict();

				var deviceName = deviceApi.get("name")[0];
				var deviceApiPath = dequotePath(deviceApi);
				var chainsCount;
				var chainApi;
				var j;

				ddic.set("id",deviceApi.id)
				ddic.set("name",deviceName)
				ddic.set("path",deviceApiPath)

				var d_on = new LiveAPI(deviceApiPath + " parameters 0")
        		var val = d_on.get("value")
				ddic.set("initial_state",val)

				var cell = (x + 2) + " " + y + " ";
				var cell = (6 + i) + " " + y + " ";
				
		        outlet(0,"set " + cell + deviceName);
		        outlet(0,"cell " + cell + " readonly 1");

		        var bcol = "180 180 180"
		        var fcol = "0 0 0"
		        if (val == 1){ bcol = " 250 250 250"}

		        outlet(0,"cell " + cell + " brgb " + bcol )
		    	outlet(0,"cell " + cell + " frgb " + fcol )

		        dic_devs.replace(id+"::"+i.toString(),ddic)

		        x += 1
		        
				// if (deviceApi.get("can_have_chains") == 1) {
				// 	chainsCount = deviceApi.getcount("chains"); // only racks have chains
				// 	for (j = 0; j < chainsCount; j++) {
				// 		chainApi = new LiveAPI(deviceApiPath + " chains " + j);
				// 		iterateDevices(chainApi);
				// 	}
				// 	chainsCount = deviceApi.getcount("return_chains"); // only racks have chains
				// 	for (j = 0; j < chainsCount; j++) {
				// 		chainApi = new LiveAPI(deviceApiPath + " return_chains " + j);
				// 		iterateDevices(chainApi);
				// 	}
				// }
			}
			catch (error){post("FEHLER " + error)}
		}
	}
}
iterateDevices.local = 1;


function dequotePath(api)
{
	return api.path.replace(/\"/g, ""); // remove quotes
}
dequotePath.local = 1;


function get_tracks() {

	var live_set_path = "live_set";
	var live_set = new LiveAPI(null, live_set_path);
	var trackCount = live_set.getcount("tracks");
    

    outlet(0,"rows " + trackCount)
    
    dic.clear()
    dic_devs.clear()
    outlet(0,"clear all")

    for (var i=0 ; i<trackCount ; i++) {

    	tr_dic = new Dict();

    	var deviceApi = new LiveAPI("this_device" + " tracks " + i);
        var track_path = live_set_path+" tracks "+i;
        var track = new LiveAPI(track_path);

        var is_grouped = Number(track.get("is_grouped"))
        var group_tr = track.get("group_track")[1]
        var is_folder = track.get("is_foldable")
        var name = track.get("name")[0]
        id = track.id
        var lvl

        dic_row_ids.set(i.toString(),id)

        tr_dic.set("nr", i)
        tr_dic.set("id", id)
        tr_dic.set("name", name)
        tr_dic.set("is_grouped", is_grouped)
        tr_dic.set("group_tr", group_tr)
        tr_dic.set("children", [id])

        var cols = get_colors(track)
        tr_dic.set("fcol",cols[0])
        tr_dic.set("bcol",cols[1])

        dic.set(id.toString(), tr_dic)

        var folder = []
        
        if (is_grouped==1) {
        	folder = get_lvl(id,group_tr,dic,folder);
        }
        var lvl = folder.length
        max_lvl = Math.max(max_lvl,lvl+2)
        tr_dic.set("lvl", lvl)
        dic.set(id.toString(), tr_dic);

        var cell = (lvl+1) + " " + i + " ";
        outlet(0,"set " + cell + name);
        outlet(0,"cell " + cell + " readonly 1");
       
        iterateDevices(track)

        //init_colors()
        //set_colors(tr_dic,cell,dic);
        
    }
    for (var i=0 ; i<trackCount ; i++) {

    	// var bcol = "211 211 211 100";
    	// for (var j=0 ; j<9 ; j++) {
    	// 	var cell = j + " " + i;
    		
    	// 	outlet(0,"cell " + cell + " brgb " + bcol )
    	// }


    	
    	id = dic_row_ids.get(i)
    	tr_dic = dic.get(id)
    	lvl = tr_dic.get("lvl")
    	var cell = (lvl+1) + " " + i + " ";
    	set_colors(tr_dic,cell,dic);

    }
    set_initial_mappings()
    post("maxLvl",max_lvl,"\n")
}

function get_lvl(id,par_id,d,folder){
	folder.push(par_id.toString())
	var track = d.get(par_id.toString())
	dic.append(par_id +"::children",id) 

	var is_grouped = track.get('is_grouped')
	if (is_grouped == 1) {
		var parent = track.get('group_tr')
		folder = get_lvl(id,parent,d,folder)
	}
	return folder
}
get_lvl.local = 1;

function hexToRgb(hex) {
	var r = hex >> 16;
	var g = hex >> 8 & 255;
	var b = hex & 255;
  	return (r + " " + g + " " + b)
}
function set_colors(tr_dic,cell,d,is_grouped){
	
	var fcol = tr_dic.get("fcol")
	var bcol = tr_dic.get("bcol")
	if (is_grouped==1){
		bcol += " 185"
	}
    outlet(0,"cell " + cell + " brgb " + bcol)
    outlet(0,"cell " + cell + " frgb " + fcol)
    if (tr_dic.get('is_grouped')==1){
    	var par = tr_dic.get('group_tr')
    	var res = cell.split(" ") 
    	var x = res[0]
    	var y = res[1]
    	cell = x-1 + " " + y
    	set_colors(d.get(par),cell,d,1)
    }
}

function clear_colors(){
	var live_set_path = "live_set";
	var live_set = new LiveAPI(null, live_set_path);
	var trackCount = live_set.getcount("tracks");
	for (var i=0 ; i<10 ; i++) {
		for (var j=0 ; j<trackCount ; j++) {
			outlet(0,"cell " + i + " "+ j + " brgb") 
			outlet(0,"cell " + i + " "+ j + " frgb")
		}
	}
}
function get_colors(track){
	var col = hexToRgb(track.get("color"))
    var col_index = track.get("color_index")
    var bcol = hexToRgb(track.get("color"))
    var fcol = "0 0 0"
    if (col_index > 62){
    	fcol =  "255 255 255";
    }
    return [fcol,bcol]
}
// function set_dimensions(){
// 	for (var i=0 ; i<trackCount ; i++) {
//     	var col = i*3
// 		outlet(0, "col " + (i*3) + " width " + col_width)
// 		outlet(0, "col " + (i*3+1) + " width " + col_width)
// 		outlet(0, "col " + (i*3+2) + " width " + col_width)
//     }
// }

function deactivate_group(gruppen_nr, val){
	var reihen = dic_maps.getkeys();
	
	for (var i=0 ; i<reihen.length ; i++) {
		reihe = reihen[i]
		gruppe = dic_maps.get(reihe)

		if (gruppen_nr == gruppe){		
			var id = dic_row_ids.get(reihe)


			// post(id+'\n')

			var track = new LiveAPI("id " + id)
			var m 
			if (val == 1){m = 0} else {m = 1}
			track.set("mute",m)


			if (gruppen_nr == gruppe){
				var children = dic.get(id + "::children")
				// post("Kinder " + children +"\n")

				for (var j=0 ; j<children.length ; j++) {
					var child = children[j];
					if (!(dic_devs.contains(child))) {continue; }

					var devs = dic_devs.get(child)
					var keys = devs.getkeys()
					len_devs = keys.length

					for (var k=0 ; k<len_devs ; k++) {
						var key = keys[k]
						var init_val = devs.get(key).get("initial_state")
						var dev_id = devs.get(key).get("id")


						if (dic_ini_states.contains(child)) {
							init_val = dic_ini_states.get(child+"::"+k.toString())
						}

						
						var val2 = val
						if (!(init_val == 1)){
							val2 = 0;		
						}
						deactivate(dev_id, val2)
					}
				}

			}
		}
	}	
}

function deactivate(id, val){
	try {
		if (id == this_id) {return}

		var dev = new LiveAPI("id " + id)
		var params = dev.get("parameters")
		var dev_on = new LiveAPI("id " + params[1])
		post("id",id +"\n")
		dev_on.set("value",val)
	}
	catch (error){post("FEHLER " + error)}
}

function set_mappings(row, group){
	if (typeof group == 'undefined'){
		if (dic_maps.get(row)) {
			delete dic_maps.remove(row)
		}
		return
	}
	if (!dic_maps.get(row)) {
		if (group != 0){
			dic_maps.set(row,group)
			var fcol = "30 3 3"
			var cell = "0 " + row
			outlet(0,"cell " + cell + " frgb " + fcol )
			post("hier\n")
		}
	}
}

function set_initial_mappings(){
	var keys = dic_maps.getkeys()
	for (var i=0 ; i<keys.length ; i++) {
		var key = keys[i]
		var val = dic_maps.get(key)
		
		var cell = "0 " + key
		outlet(0,"set " + cell + " " + val)
		var fcol = "155 50 50 255"
		outlet(0,"cell " + cell + " frgb " + fcol )
	}

}
function set_initial_states(dev_nr,row,txt){
	if(txt == "xxx") {return}
	if(dev_nr < 0) {return}

	var id = dic_row_ids.get(row)
	var ini_state
	if (dic_ini_states.contains(id)) {
		ini_state = dic_ini_states.get(id+"::"+dev_nr.toString())
	} else {
		ini_state = dic_devs.get(id).get(dev_nr).get("initial_state")
	}

	if (ini_state == 1) {ini_state = 0}
		else {ini_state = 1}
	dic_ini_states.replace(id+"::"+dev_nr , ini_state)

	var cell = (6+dev_nr) + " " + row
	if (ini_state == 1) {
		bcol = "0 255 0"
		outlet(0,"cell " + cell + " brgb " + bcol )
	} else {
		bcol = "0 150 0"
		outlet(0,"cell " + cell + " brgb " + bcol )
	}	
}