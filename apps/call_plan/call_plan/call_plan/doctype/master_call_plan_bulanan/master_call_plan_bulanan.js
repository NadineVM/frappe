// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt
var maks_jumlah_kunjungan=4
var months=['January','February','March','April','May','June','July','August','September','October','November','December']
var month;
var year;
var date;
var child;
var planned_merchant;

function set_opsi_pr(frm){
    if (frm.doc.user_pic_role=='PR'){
        frm.set_value('pr',frm.doc.user_pic_code)
        frm.set_df_property('pr','read_only',1)
    }
    else if (frm.doc.user_pic_role=='SPAR'){
        frm.set_query('pr',()=>{
            return{
                'filters':{
                    'parent_klasifikasi_pic_merchant':frm.doc.user_pic_code
                }
            }
        })
    }
    else if (frm.doc.user_pic_role=='ASM'){
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
function set_opsi_tahun(frm){
    var currentTime = new Date();
    date= currentTime.getDate();
    month=currentTime.getMonth();
    year=currentTime.getFullYear();
    frm.set_df_property('tahun','options',[String(year),String(year+1)])

}
function set_opsi_bulan(frm){
    if (frm.doc.tahun){
    let avail_months;
        if (frm.doc.tahun==year){
            if (date<26){  
                avail_months=months.slice(month+1)
            }
            else{
                avail_months=months.slice(month+2)
            }
        }
        else{
            if (month==11 && date>25){
                avail_months=months.slice(1)
            }
            else{
                avail_months=months
            }
        }
        frm.set_df_property('bulan','options',avail_months)
}
}

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

//js jalan dulu sebelum python selesai & return value
function cek_tanggal(frm){
    var selected_month_number=String(months.indexOf(frm.doc.bulan)+1).padStart(2,'0')
    let list_error=[]
    frm.doc.call_plan.forEach((row)=>{
        let frekuensi=row.frekuensi
        for (let i = 0; i < frekuensi; i++){
            let field_kunjungan='kunjungan_'+String(i+1)
            if (row[field_kunjungan]<`${frm.doc.tahun}-${selected_month_number}-01`||row[field_kunjungan]>`${frm.doc.tahun}-${selected_month_number}-31`){
                //list_error.push(`kunjungan ${String(i+1)} of ${row.fetched_merchant_name}`)
                list_error.push(`${row.fetched_merchant_name}`)
                break
            }
        }        
    })
    if (list_error.length>0){
        frappe.msgprint(__(`You can only select dates in ${frm.doc.bulan} ${frm.doc.tahun} in ${list_error.join(', ')}`));
        frappe.validated=false}
    
}

function set_filter_merchant(frm){
    if(frm.doc.pr){
        planned_merchant=[]
        //non avail merchant adalah semua merchant yang sudah diselect kecuali merchant di doctype yang sedang diedit
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
    //trigger cek unplanned merchant
    cek_unplanned_merchant(frm)  
    }

}

function cek_unplanned_merchant(frm){
    //dapatkan merchant yang belum diplan
    frm.call('get_merchant_list',{planned_merchant:planned_merchant,pr:frm.doc.pr}).then((unplanned_merchant)=>{
        //jika ada merchant yang belum diplan
        if(unplanned_merchant.message.length>0){      
            frm.set_value('kelengkapan','Belum lengkap')
            frm.set_value('keterangan',
                //`<p>${unplanned_merchant.message.length} unplanned merchants: ${unplanned_merchant.message.join(', ')}<p>`
                 `${unplanned_merchant.message.length}`
            )
        }
        //jika semua merchant sudah diplan
        else{
            frm.set_value('kelengkapan','Lengkap')
            frm.set_value('keterangan','')
        }
    })
}


function set_route_realisasi(frm,cdt,cdn){
    child=locals[cdt][cdn]
    let realisasi_baru=`<button class="btn btn-primary" onclick="window.location.href='/app/call-realisasi/new?master_plan=${frm.docname}&nama_merchantklinik=${child.merchant_name}'">Mulai Realisasi</button>`
    frm.set_df_property('call_plan', "options", realisasi_baru, frm.docname, `start_realisasi`, child.name)
    for (let i = 0; i < child.frekuensi; i++){
        /* if (child[`status_${i+1}`]=='Belum realisasi'){
            frm.set_df_property('call_plan', "options", realisasi_baru, frm.docname, `realisasi_route_${i+1}`, child.name);} */
        if (child[`status_${i+1}`]!='Belum realisasi'){
            let tanggal_kunjungan=frappe.format(child[`kunjungan_${i+1}`],{ fieldtype: 'Date' })
            let realisasi_route=`<a href="/app/call-realisasi/CR-${child.merchant_name}(${tanggal_kunjungan})">Go to realisasi</a>`
            frm.set_df_property('call_plan', "options", realisasi_route, frm.docname, `realisasi_route_${i+1}`, child.name);}
    
    }
}

frappe.ui.form.on("Master Call Plan bulanan", {
//set informasi merchant yang sudah diplan sebelum save
    validate(frm){
        //cek tanggal kunjungan untuk semua row
        cek_tanggal(frm)
    },

//set filter, cek unplanned merchant, dan set opsi tahun (jika belum diset) saat form di load
    refresh(frm){
        if(frm.doc.amended_from){
            //jika hasil amend, field tahun, bulan, pr, ditransfer dan tidak bisa diubah
            frm.set_df_property('tahun','options',frm.doc.tahun)
            frm.set_df_property('bulan','options',frm.doc.bulan)
            frm.set_df_property('tahun','read_only',1)
            frm.set_df_property('bulan','read_only',1)
            frm.set_df_property('pr','read_only',1)
            //set filter merchant
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

frappe.ui.form.on("Master Call Plan copy", {
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

    
    frekuensi(frm,cdt,cdn){
        child=locals[cdt][cdn]
        let frekuensi=child.frekuensi;
        for (let i = 0; i < maks_jumlah_kunjungan; i++){
            if (i+1>frekuensi){
                if(child['kunjungan_'+String(i+1)]){
                    frappe.model.set_value(cdt,cdn,'kunjungan_'+String(i+1), undefined)
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


