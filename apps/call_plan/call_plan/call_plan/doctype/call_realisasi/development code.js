//declare toleransi perbedaan longitude&latitude antara call dan merchant
var toleransi_dalam_meter=50

frappe.ui.form.on("Call Realisasi", {
	//dapatkan opsi tanggal yang belum direalisasi berdasarkan master plan dan nama merchant
 	get_opsi_tanggal(frm){
		if(frm.doc.nama_merchantklinik&&frm.doc.master_plan){
		frm.call('get_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik}).then(opsi_tanggal =>{
			frm.set_df_property('tanggal_target','options',opsi_tanggal.message)
		})}
	},

	//dapatkan merchant yang belum atau sedang direalisasi (eliminate yang sudah realisasi)
	set_filter_merchant(frm){
		if(frm.doc.master_plan){
			frm.call('get_merchant',{master_plan:frm.doc.master_plan}).then(merchants =>{
				frm.set_query('nama_merchantklinik',()=>{
					return{
						'filters':{
							'merchant_code':['in',merchants.message]
						}
					}
				})
			})
		}
	},

	//set map lokasi merchant
	//akan ditrigger setiap refresh dan perubahan merchant & jenis kunjungan
	set_map_merchant(frm) {
		if(frm.doc.jenis_kunjungan=='Offline'&&frm.doc.merch_latitude&&frm.doc.merch_longitude){
			let html =
				'<div class="mapouter"><div class="gmap_canvas"><iframe width=80% height="300" id="gmap_canvas"' +
            'src="https://maps.google.com/maps?q='+frm.doc.merch_latitude+','+frm.doc.merch_longitude+
            '&t=&z=17&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe></div>';
			frm.set_df_property("locationmerchant", "options", html);}
	},


    //set map lokasi call
    set_map_call(frm){
        if (frm.doc.call_longitude && frm.doc.call_latitude) {
            let html = '<div class="mapouter"><div class="gmap_canvas"><iframe width=80% height="300" id="gmap_canvas"' +
            'src="https://maps.google.com/maps?q='+frm.doc.call_latitude+','+frm.doc.call_longitude+
            '&t=&z=17&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe></div>';
            
            frm.set_df_property('locationcall', 'options', html);
        };
    },

	//cek kesesuaian lokasi merchant dan call, dengan toleransi yang sudah diset
	//dipanggil ketika take photo, karena saat lokasi call akan diambil
	cek_lokasi(frm){
		let merch_latitude=Number(frm.doc.merch_latitude)
		let merch_longitude=Number(frm.doc.merch_longitude)
		let call_latitude=Number(frm.doc.call_latitude)
		let call_longitude=Number(frm.doc.call_longitude)
		let toleransi_latitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)
		let toleransi_longitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)/Math.cos(Number(merch_latitude)*Math.PI/180)

		if (call_latitude> merch_latitude+ toleransi_latitude || call_latitude< merch_latitude-toleransi_latitude||
			call_longitude> merch_longitude+ toleransi_longitude || call_longitude<merch_longitude-toleransi_longitude
		){
			frappe.msgprint(__('Lokasi anda tidak sesuai dengan lokasi merchant'));
			frm.set_value('kesesuaian_lokasi','Tidak Sesuai')
		}
		else{
			frm.set_value('kesesuaian_lokasi','Sesuai')
		}
	},


    ////di bawah ini akan berjalan sesuai form events (eg refresh, submit, ketika suatu field diubah) 
	
	//perlu klik mulai realisasi sebelum save dan setidaknya 1 attachment
	validate(frm){
		if(!frm.doc.tanggal_kunjungan){
			frappe.msgprint(__('Mulai realisasi belum diklik'));
			frappe.validated=false; //gagalkan save
		}
        ///update
        if(frm.doc.jenis_kunjungan=='Offline'&&!frm.doc.kesesuaian_lokasi){
            frappe.msgprint(__('Lokasi belum dicek'))
            frappe.validated=false
        }
        ///update
        
	},
    ///update
    //perlu setidaknya 1 attachment untuk submit
	before_submit(frm){
        let attachments=frm.get_files();
		if (attachments.length==0){
		    frappe.throw(__('Harus menyertakan minimal 1 foto'))
		}
	},
    ///update

	refresh(frm) {
        ///update
        //reset location merchant dan location call
        frm.set_df_property('locationmerchant','options',' ')
        frm.set_df_property('locationcall','options',' ')
        ///update
		frm.trigger('set_map_merchant')
		frm.trigger('set_map_call')
		if (frm.doc.tanggal_kunjungan) {
			frm.fields_dict.mulai_realisasi.toggle(false);
			}
		
		if (frm.doc.docstatus==0){
			frm.set_query('master_plan',()=>{
				return{
				'filters':{
					'workflow_state': 'Approved'
					}
				}
			})
			frm.trigger('set_filter_merchant')
			frm.trigger('get_opsi_tanggal')
		}
	},

	//MEKANISME STATUS

	//(1) jika realisasi disubmit maka status tanggal kunjungan di master plan akan diubah menjadi 'sudah realisasi','sudah realisasi(... tidak sesuai)' 
	on_submit(frm){
		if (frm.doc.kesesuaian_tanggal=='Tidak Sesuai'&&frm.doc.kesesuaian_lokasi=='Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (tanggal tidak sesuai)'})}
		else if (frm.doc.kesesuaian_lokasi=='Tidak Sesuai'&&frm.doc.kesesuaian_tanggal=='Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (lokasi tidak sesuai)'})}		
		else if(frm.doc.kesesuaian_tanggal=='Tidak Sesuai'&&frm.doc.kesesuaian_lokasi=='Tidak Sesuai'){
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi (tanggal dan lokasi tidak sesuai)'})}
		else {
			frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Sudah realisasi'})}
	},

	//(2) jika realisasi dicancel atau didiscard maka status tanggal kunjungan di master plan akan diubah menjadi 'belum realisasi'
	before_cancel(frm){
		frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Belum realisasi'})
	},
	before_discard(frm){
		frm.call('set_status_tanggal',{master_plan:frm.doc.master_plan,merchant_name:frm.doc.nama_merchantklinik,tanggal_target:frm.doc.tanggal_target,status_completion:'Belum realisasi'})
	},

	master_plan(frm) {
		//ubah filter merchant sesuai perubahan master plan
		frm.trigger('set_filter_merchant')
		//reset nama merchant dan tanggal kunjungan jika ada perubahan master plan
		if(frm.doc.tanggal_kunjungan){
		    frm.fields_dict.mulai_realisasi.toggle(true); //button 'mulai realisasi' ditampilkan kembali
		    frm.set_value('tanggal_kunjungan','')}
			frm.set_value('kesesuaian_tanggal','');
		
		if(frm.doc.nama_merchantklinik){
			frm.set_value('nama_merchantklinik','')}
	},

	nama_merchantklinik(frm){
		frm.trigger('get_opsi_tanggal')
		frm.trigger('set_map_merchant')
		//reset tanggal kunjungan jika ada perubahan merchant
		if(frm.doc.tanggal_kunjungan){
		    frm.fields_dict.mulai_realisasi.toggle(true);
		    frm.set_value('tanggal_kunjungan','')}
			frm.set_value('kesesuaian_tanggal','');
        //Update
		//cek kesesuaian lokasi utk merchant baru
        if(frm.doc.kesesuaian_lokasi){
            frm.trigger("cek_lokasi")}
        //Update
	},

	//lock tanggal dan waktu kunjungan
	mulai_realisasi(frm) {
		console.log('mulai_realisasi tertrigger')
		function format(num, len = 2) { //formating waktu misal '5' menjadi '05'
			return `${num}`.padStart(len, '0');
		  }
		let currentTime = new Date();
		let hours=format(currentTime.getHours())
        let minutes=format(currentTime.getMinutes())
		let seconds=format(currentTime.getSeconds())
        let month=format(currentTime.getMonth()+1)
		let date=format(currentTime.getDate())
        let year=format(currentTime.getFullYear())
		if (frm.doc.tanggal_target!=`${date}-${month}-${year}`){ //jika tanggal hari ini tidak sama dengan tanggal target
			frappe.confirm('Tanggal target kunjungan tidak sama dengan tanggal hari ini, lanjutkan?',function(){
				frm.fields_dict.mulai_realisasi.toggle(false);
				frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`);
				frm.set_value('kesesuaian_tanggal','Tidak Sesuai'); //set kesesuaian tanggal menjadi tidak sesuai
			})
		}
		else{
			frm.fields_dict.mulai_realisasi.toggle(false);
			frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`)
			frm.set_value('kesesuaian_tanggal','Sesuai');
		}
	},

	jenis_kunjungan(frm){
		frm.trigger('set_map_merchant')
        frm.trigger('set_map_call')
	},
        
    photo(frm) {
        const capture = new frappe.ui.Capture({
            animate: false,
            error: true,
        });


        capture.show();


        capture.submit(dataurl => {
           
            function url_to_file(url, filename, mimeType){
                return (fetch(url)
                        .then(function(res){return res.arrayBuffer();})
                        .then(function(buf){return new File([buf], filename, {type:mimeType});})
                );
            };
            
            function onPositionRecieved(position){
                var call_longitude= position.coords.longitude;
                var call_latitude= position.coords.latitude;
                frm.set_value('call_longitude',call_longitude);
                frm.set_value('call_latitude',call_latitude);
                frm.trigger('cek_lokasi'); //cek kesesuaian lokasi
                
                frm.trigger('set_map_call'); //set map lokasi call
                
                frm.refresh_field('locationcall');
            }
            
            function locationNotRecieved(positionError){
                frappe.msgprint(__('Tidak berhasil mendapatkan lokasi:'+positionError.message));
            }
            
            navigator.geolocation.getCurrentPosition(onPositionRecieved,locationNotRecieved,{enableHighAccuracy: true});
            
            frm.refresh();

            frm.save();


            dataurl.forEach(data_url => {
                let filename = `capture_${frappe.datetime
                    .now_datetime()
                    .replaceAll(/[: -]/g, "_")}.png`;
               
                url_to_file(data_url, filename, "image/png").then(file => {
                    let xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = () => {
                        if (xhr.status === 200 && xhr.responseText) {
                            let r = null;
                           
                            try {
                                r = JSON.parse(xhr.responseText);
                                if (r.message.doctype === "File") {                                                                              
                                    frm.attachments.update_attachment(r.message);
                                    //frm.doc.docstatus == 1 ? frm.save("Update") : frm.save();
                           
                                }
                            } catch (e) {
                                r = xhr.responseText;
                                console.log(e);
                            }                      
                        };
                    };
                    xhr.open("POST", "/api/method/upload_file", true);
                    xhr.setRequestHeader("Accept", "application/json");
                    xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);                
                   
                    let form_data = new FormData();


                    form_data.append("file", file, file.name);
                                               
                    form_data.append("is_private", 1);
                    form_data.append("folder", "Home");                      


                    form_data.append("doctype", frm.doctype);
                    form_data.append("docname", frm.docname);
                       
                        //form_data.append("fieldname", 'link');
                    form_data.append("content", data_url);
                       
                    form_data.append("optimize", true);
                    form_data.append("max_width", 200);
                    form_data.append("max_height", 200);
                       
                    xhr.send(form_data);
                       
                   
                })


            });
        })
    },  
    
        
    
    });
    
////////////////////////////////////////////////MASTER CALL PLAN CODE/////////////////////////////////////////////////////////
//declare semua variabel yang akan digunakan
var maks_jumlah_kunjungan=4
var months=['January','February','March','April','May','June','July','August','September','October','November','December']
var month;
var year;
var date;
var child;
var planned_merchant;
var currentTime;

//set opsi pr berdasarkan role user
//dipanggil setiap user_pic_code diubah
function set_opsi_pr(frm){
    if (frm.doc.user_pic_role=='PR'){ //PR hanya bisa select PRnya sendiri
        frm.set_value('pr',frm.doc.user_pic_code)
        frm.set_df_property('pr','read_only',1)
    }
    else if (frm.doc.user_pic_role=='SPAR'){ //SPAR bisa select PR yang di bawahnya
        frm.set_query('pr',()=>{
            return{
                'filters':{
                    'parent_klasifikasi_pic_merchant':frm.doc.user_pic_code
                }
            }
        })
    }
    else if (frm.doc.user_pic_role=='ASM'){ //ASM bisa select PR yang di bawah ASM di bawahnya
        //call function utk mendapatkan semua PR di bawah asm tersebut
        frm.call('get_pr_of_asm',{asm:frm.doc.user_pic_code}).then((pr_list)=>{
            console.log(pr_list.message)
            frm.set_query('pr',()=>{
                return{
                    'filters':{
                        'name':['in',pr_list.message]
                    }
                }
            })
        
        })
    }
}
//opsi tahun diset tahun ini & tahun depan
//dipanggil setiap refresh
function set_opsi_tahun(frm){
    currentTime = new Date();
    year=currentTime.getFullYear();//tahun sekarang
    frm.set_df_property('tahun','options',[String(year),String(year+1)]) 
}

//hanya bisa memilih bulan berikutnya maks tanggal 25, selebihnya tidak dibatasi
//dipanggil setiap refresh dan setiap kali tahun diubah
function set_opsi_bulan(frm){
    date= currentTime.getDate();//tanggal hari ini
    month=currentTime.getMonth();//bulan sekarang
    if (frm.doc.tahun){
    let avail_months;
        if (frm.doc.tahun==year){ //jika tahun ini
            if (date<26){  
                avail_months=months.slice(month+1) //jika belum lewat tanggal 25 
            }
            else{
                avail_months=months.slice(month+2) //jika sudah lewat tanggal 25
            }
        }
        else{ //jika tahun depan
            if (month==11 && date>25){ //jika ini bulan desember dan sudah lewat tanggal 25, tidak bisa select januari tahun depan
                avail_months=months.slice(1)
            }
            else{
                avail_months=months
            }
        }
        frm.set_df_property('bulan','options',avail_months)
}
}

//VALIDASI TANGGAL KUNJUNGAN

//validasi tanggal(1) tidak boleh ada duplikat tanggal di satu merchant yang sama
//dipanggil setiap kali tanggal diubah
function cek_duplicate_tanggal(frm,cdt,cdn,field_tanggal,field_tanggal_lain){
    child=locals[cdt][cdn]
    if (child[field_tanggal]){
        let tanggal=child[field_tanggal]
        field_tanggal_lain.forEach((field)=>{
            if (child[field]&&child[field]==tanggal){
                no_field=field.split('_')[1]
                //frappe.msgprint(__(`Duplicate date in kunjungan ${no_field}`));
                frappe.show_alert(`Duplicate date in kunjungan ${no_field}`, 7);
                frappe.model.set_value(cdt,cdn,field_tanggal, "")
            }
         })
    }
}

//validasi tanggal(2) tidak boleh ada select tanggal di hari minggu
//dipanggil setiap kali tanggal diubah
function validasi_tanggal_weekday(frm,cdt,cdn,field_tanggal){
    child=locals[cdt][cdn]
    if (child[field_tanggal]){
        let tanggal_objek=new Date(child[field_tanggal])
        let hari=tanggal_objek.getDay()
        if (hari==0){
            //frappe.msgprint(__(`Tidak bisa plan kunjungan di hari minggu`));
            frappe.show_alert('Tidak bisa plan kunjungan di hari minggu', 7);
            frappe.model.set_value(cdt,cdn,field_tanggal, "")
        }}
}

//validasi tanggal(3) tidak boleh select tanggal di luar tahun & bulan yang dipilih
//dipanggil setiap kali save & muncul pop up jika ada yang tidak sesuai
function cek_tanggal(frm){
    var selected_month_number=String(months.indexOf(frm.doc.bulan)+1).padStart(2,'0')
    let list_error=[]
    frm.doc.call_plan.forEach((row)=>{
        let frekuensi=row.frekuensi
        for (let i = 0; i < frekuensi; i++){
            let field_kunjungan='kunjungan_'+String(i+1)
            if (row[field_kunjungan]<`${frm.doc.tahun}-${selected_month_number}-01`||row[field_kunjungan]>`${frm.doc.tahun}-${selected_month_number}-31`){
                list_error.push(`${row.fetched_merchant_name}`)
                break //jika salah satu tanggal salah, tidak perlu cek tanggal lainnya supaya nama merchant tidak dobel
            }
        }        
    })
    if (list_error.length>0){ //jika ada tanggal salah
        frappe.msgprint(__(`You can only select dates in ${frm.doc.bulan} ${frm.doc.tahun} in ${list_error.join(', ')}`));
        frappe.validated=false} //batalkan save
    
}

//pastikan setiap merchant hanya diselect sekali (tidak ada 2 row dengan merchant yang sama)
//dipanggil setiap refresh, pr berubah, merchant name berubah (harus tutup dan buka lagi form view row itu utk merefresh), row dihapus 
function set_filter_merchant(frm){
    if(frm.doc.pr){
        planned_merchant=[]
        frm.doc.call_plan.forEach((row)=>{
            if (row.merchant_name){
                planned_merchant.push(row.merchant_name)
            }
        })
        frm.set_query('merchant_name','call_plan',()=>{
            return{
                'filters':{
                    'merchant_code':['not in',planned_merchant],
                    'pic_pr':frm.doc.pr
                }
            }
        })
    //trigger cek unplanned merchant untuk mengecek kelengkapan merchant & hitung merchant yang belum diplan
    cek_unplanned_merchant(frm)  
    }

}

//selalu dipanggil setiap set_filter_merchant dipanggil
function cek_unplanned_merchant(frm){
    //dapatkan merchant yang belum diplan
    frm.call('get_merchant_list',{planned_merchant:planned_merchant,pr:frm.doc.pr}).then((unplanned_merchant)=>{
        //jika ada merchant yang belum diplan
        if(unplanned_merchant.message.length>0){      
            frm.set_value('kelengkapan','Belum lengkap')
            frm.set_value('keterangan', `${unplanned_merchant.message.length}`)
        }
        //jika semua merchant sudah diplan
        else{
            frm.set_value('kelengkapan','Lengkap')
            frm.set_value('keterangan','')
        }
    })
}

//set tombol realisasi di setiap row dan link ke call realisasi utk tanggal kunjungan yang sudah direalisasi
//hanya dipanggil jika status form adalah approved
function set_route_realisasi(frm,cdt,cdn){
    child=locals[cdt][cdn]
    let realisasi_baru=`<button class="btn btn-primary" onclick="window.location.href='/app/call-realisasi/new?master_plan=${frm.docname}&nama_merchantklinik=${child.merchant_name}'">Mulai Realisasi</button>`
    frm.set_df_property('call_plan', "options", realisasi_baru, frm.docname, `start_realisasi`, child.name)
    for (let i = 0; i < child.frekuensi; i++){
        if (child[`status_${i+1}`]!='Belum realisasi'){
            let tanggal_kunjungan=frappe.format(child[`kunjungan_${i+1}`],{ fieldtype: 'Date' })
            //dapatkan nama call realisasi untuk tanggal kunjungan tersebut
            frm.call('get_call_realisasi',{master_plan:frm.docname,merchant_name:child.merchant_name,tanggal_kunjungan:tanggal_kunjungan}).then((realisasi)=>{
            console.log(realisasi.message)
                let realisasi_route=`<a href="/app/call-realisasi/${realisasi.message}">Go to realisasi</a>`
            frm.set_df_property('call_plan', "options", realisasi_route, frm.docname, `realisasi_route_${i+1}`, child.name);})
        }
    }
}

frappe.ui.form.on("Call Plan", {

    validate(frm){
        cek_tanggal(frm)
    },

    refresh(frm){
        if(frm.doc.amended_from){ //jika form hasil amend dari cancelled form
            //field tahun, bulan, pr ditransfer dari cancelled form dan tidak bisa diubah
            frm.set_df_property('tahun','options',frm.doc.tahun)
            frm.set_df_property('bulan','options',frm.doc.bulan)
            frm.set_df_property('tahun','read_only',1)
            frm.set_df_property('bulan','read_only',1)
            frm.set_df_property('pr','read_only',1)
            set_filter_merchant(frm)
        }
        //set opsi field jika form masih editable (draft)
        else if(frm.doc.docstatus==0 && !frm.doc.amended_from){
            set_opsi_tahun(frm)
            set_opsi_bulan(frm)
            if (!frm.doc.user){
                frm.set_value('user',frappe.session.user)
            }
            set_filter_merchant(frm)
        }
    },

    user_pic_code(frm){
        set_opsi_pr(frm)
    },

//set opsi bulan ketika tahun dipilih
    tahun(frm){
        set_opsi_bulan(frm)
    },

    pr(frm){
        set_filter_merchant(frm)
    }
 });

frappe.ui.form.on("Call Planning", {
    form_render(frm,cdt,cdn){
        //kalau form sudah approve, tampilkan tombol-tombol realisasi
        if (frm.doc.workflow_state=='Approved'){
            set_route_realisasi(frm,cdt,cdn)}
    },
    merchant_name(frm,cdt,cdn){
        set_filter_merchant(frm)
        
    },
    call_plan_remove(frm,cdt,cdn){ 
        set_filter_merchant(frm)
        
    },

    //pastikan jumlah tanggal kunjungan sesuai dengan frekuensi
    frekuensi(frm,cdt,cdn){
        child=locals[cdt][cdn]
        let frekuensi=child.frekuensi;
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if (i+1>frekuensi){
                if(child['kunjungan_'+String(i+1)]){
                    frappe.model.set_value(cdt,cdn,'kunjungan_'+String(i+1), undefined) //hapus tanggal kunjungan jika frekuensi dikurangi
                }
            }
        }
    },
    kunjungan_1(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_1',['kunjungan_2','kunjungan_3','kunjungan_4'])
        validasi_tanggal_weekday(frm,cdt,cdn,'kunjungan_1')
    },
    kunjungan_2(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_2',['kunjungan_1','kunjungan_3','kunjungan_4'])
        validasi_tanggal_weekday(frm,cdt,cdn,'kunjungan_2')
    },
    kunjungan_3(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_3',['kunjungan_1','kunjungan_2','kunjungan_4'])
        validasi_tanggal_weekday(frm,cdt,cdn,'kunjungan_3')
    },
    kunjungan_4(frm,cdt,cdn){
        cek_duplicate_tanggal(frm,cdt,cdn,'kunjungan_4',['kunjungan_1','kunjungan_2','kunjungan_3'])
        validasi_tanggal_weekday(frm,cdt,cdn,'kunjungan_4')
    },
});

//////////////////////////////////////////////////UNPLAN CALL REALISASI//////////////////////////////////////////////////////////
//declare toleransi perbedaan longitude&latitude antara call dan merchant
var toleransi_dalam_meter=50

frappe.ui.form.on("Unplanned Call Realisasi", {
	//set map lokasi merchant
	//akan ditrigger setiap refresh dan perubahan merchant & jenis kunjungan
	set_map_merchant(frm) {
		if(frm.doc.jenis_kunjungan=='Offline'&&frm.doc.merch_latitude&&frm.doc.merch_longitude){
			let html =
				'<div class="mapouter"><div class="gmap_canvas"><iframe width=80% height="300" id="gmap_canvas"' +
            'src="https://maps.google.com/maps?q='+frm.doc.merch_latitude+','+frm.doc.merch_longitude+
            '&t=&z=17&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe></div>';
			frm.set_df_property("locationmerchant", "options", html);}
	},


    //set map lokasi call
    //akan ditrigger setiap refresh dan perubahan jenis kunjungan
    set_map_call(frm){
        if (frm.doc.call_longitude && frm.doc.call_latitude) {
            let html = '<div class="mapouter"><div class="gmap_canvas"><iframe width=80% height="300" id="gmap_canvas"' +
            'src="https://maps.google.com/maps?q='+frm.doc.call_latitude+','+frm.doc.call_longitude+
            '&t=&z=17&ie=UTF8&iwloc=&output=embed" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe></div>';
            
            frm.set_df_property('locationcall', 'options', html);
        };
    },

	//cek kesesuaian lokasi merchant dan call, dengan toleransi yang sudah diset
	//dipanggil ketika take photo, karena saat lokasi call akan diambil
	cek_lokasi(frm){
		let merch_latitude=Number(frm.doc.merch_latitude)
		let merch_longitude=Number(frm.doc.merch_longitude)
		let call_latitude=Number(frm.doc.call_latitude)
		let call_longitude=Number(frm.doc.call_longitude)
		let toleransi_latitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)
		let toleransi_longitude=(toleransi_dalam_meter / 6378000) * (180 / Math.PI)/Math.cos(Number(merch_latitude)*Math.PI/180)

		if (call_latitude> merch_latitude+ toleransi_latitude || call_latitude< merch_latitude-toleransi_latitude||
			call_longitude> merch_longitude+ toleransi_longitude || call_longitude<merch_longitude-toleransi_longitude
		){
			frappe.msgprint(__('Lokasi anda tidak sesuai dengan lokasi merchant'));
			frm.set_value('kesesuaian_lokasi','Tidak Sesuai')
		}
		else{
			frm.set_value('kesesuaian_lokasi','Sesuai')
		}
	},


    ////di bawah ini akan berjalan sesuai form events (eg refresh, submit, ketika suatu field diubah) 
	
	//perlu klik mulai realisasi sebelum save dan setidaknya 1 attachment
	validate(frm){
		if(!frm.doc.tanggal_kunjungan){
			frappe.msgprint(__('Mulai realisasi belum diklik'));
			frappe.validated=false; //gagalkan save
		}
        
        let attachments=frm.get_files();
		if (attachments.length==0){
			frappe.msgprint(__('Harus menyertakan minimal 1 foto'));
			frappe.validated=false;
		}
	}
	,
	refresh(frm) {
        //reset location merchant dan location call
        frm.set_df_property('locationmerchant','options',' ')
        frm.set_df_property('locationcall','options',' ')
		frm.trigger('set_map_merchant')
		frm.trigger('set_map_call')
        //kalau sdh mulai realisasi, button mulai realisasi tetap hilang
		if (frm.doc.tanggal_kunjungan) {
			frm.fields_dict.mulai_realisasi.toggle(false);
			}
		
	},


	nama_merchantklinik(frm){
		frm.trigger('set_map_merchant')
		//cek ulang kesesuaian lokasi utk perubahan merchant
        if(frm.doc.kesesuaian_lokasi){
            frm.trigger("cek_lokasi")}
	},

	//lock tanggal dan waktu kunjungan ketika mulai realisasi diklik
	mulai_realisasi(frm) {
		console.log('mulai_realisasi tertrigger')
		function format(num, len = 2) { //formating waktu misal '5' menjadi '05'
			return `${num}`.padStart(len, '0');
		  }
		let currentTime = new Date();
		let hours=format(currentTime.getHours())
        let minutes=format(currentTime.getMinutes())
		let seconds=format(currentTime.getSeconds())
        let month=format(currentTime.getMonth()+1)
		let date=format(currentTime.getDate())
        let year=format(currentTime.getFullYear())
		if (frm.doc.tanggal_target!=`${date}-${month}-${year}`){ //jika tanggal hari ini tidak sama dengan tanggal target
			frappe.confirm('Tanggal target kunjungan tidak sama dengan tanggal hari ini, lanjutkan?',function(){
				frm.fields_dict.mulai_realisasi.toggle(false);
				frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`);
				frm.set_value('kesesuaian_tanggal','Tidak Sesuai'); //set kesesuaian tanggal menjadi tidak sesuai
			})
		}
		else{
			frm.fields_dict.mulai_realisasi.toggle(false);
			frm.set_value("tanggal_kunjungan", `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`)
			frm.set_value('kesesuaian_tanggal','Sesuai');
		}
	},

	jenis_kunjungan(frm){
		frm.trigger('set_map_merchant')
        frm.trigger('set_map_call')
	},
        
    photo(frm) {
        const capture = new frappe.ui.Capture({
            animate: false,
            error: true,
        });


        capture.show();


        capture.submit(dataurl => {
           
            function url_to_file(url, filename, mimeType){
                return (fetch(url)
                        .then(function(res){return res.arrayBuffer();})
                        .then(function(buf){return new File([buf], filename, {type:mimeType});})
                );
            };
            
            function onPositionRecieved(position){
                var call_longitude= position.coords.longitude;
                var call_latitude= position.coords.latitude;
                frm.set_value('call_longitude',call_longitude);
                frm.set_value('call_latitude',call_latitude);
                frm.trigger('cek_lokasi'); //cek kesesuaian lokasi
                
                frm.trigger('set_map_call'); //set map lokasi call
                
                frm.refresh_field('locationcall');
            }
            
            function locationNotRecieved(positionError){
                frappe.msgprint(__('Tidak berhasil mendapatkan lokasi:'+positionError.message));
            }
            
            navigator.geolocation.getCurrentPosition(onPositionRecieved,locationNotRecieved,{enableHighAccuracy: true});
            
            frm.refresh();

            frm.save();


            dataurl.forEach(data_url => {
                let filename = `capture_${frappe.datetime
                    .now_datetime()
                    .replaceAll(/[: -]/g, "_")}.png`;
               
                url_to_file(data_url, filename, "image/png").then(file => {
                    let xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = () => {
                        if (xhr.status === 200 && xhr.responseText) {
                            let r = null;
                           
                            try {
                                r = JSON.parse(xhr.responseText);
                                if (r.message.doctype === "File") {                                                                              
                                    frm.attachments.update_attachment(r.message);
                                    //frm.doc.docstatus == 1 ? frm.save("Update") : frm.save();
                           
                                }
                            } catch (e) {
                                r = xhr.responseText;
                                console.log(e);
                            }                      
                        };
                    };
                    xhr.open("POST", "/api/method/upload_file", true);
                    xhr.setRequestHeader("Accept", "application/json");
                    xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);                
                   
                    let form_data = new FormData();


                    form_data.append("file", file, file.name);
                                               
                    form_data.append("is_private", 1);
                    form_data.append("folder", "Home");                      


                    form_data.append("doctype", frm.doctype);
                    form_data.append("docname", frm.docname);
                       
                        //form_data.append("fieldname", 'link');
                    form_data.append("content", data_url);
                       
                    form_data.append("optimize", true);
                    form_data.append("max_width", 200);
                    form_data.append("max_height", 200);
                       
                    xhr.send(form_data);
                       
                   
                })


            });
        })
    },  
    
        
    
    });

