// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

/* frappe.ui.form.on("image testing parent", {
    
 }); */

 frappe.ui.form.on("image testing", {
	form_render(frm,cdt,cdn){
		frm.fields_dict["child_doc"].$wrapper.find('[data-action="clear_attachment"]').hide();
		showpic(frm)
	},
	clear_image1(frm,cdt,cdn){
		clearImageField(frm,cdt,cdn,'image1')
	},
	clear_image2(frm,cdt,cdn){
		clearImageField(frm,cdt,cdn,'image2')
	},
	image1(frm){
		showpic(frm)},

	image2(frm){
		showpic(frm)
	}
	
})

function showpic(frm) {
	const image_fields = [
		"image1",
		"image2",
	  ];
	  const display_fields = [
		"view_image1",
		"view_image2",
	  ];
	frm.doc.child_doc.forEach ( (row) => {
		image_fields.forEach((image_field,i) => {
			if (row[image_field]){
			frm.set_df_property('child_doc', "options", `<img src=${row[image_field]} width='300'>`, frm.docname, display_fields[i], row.name);}
			else{
				frm.set_df_property('child_doc', "options",'', frm.docname, display_fields[i], row.name);
				let $clearButton = frm.fields_dict.child_doc.$wrapper.find(`[data-name="${row.name}"]`).find(`[data-fieldname="clear_${image_field}"]`);
				$clearButton.hide()
			}	
		})
	})
}

function clearImageField(frm, cdt,cdn, imageField) {
	frappe.confirm(`Are you sure you want to clear ${imageField}?`, function() {
	  frappe.model.set_value(cdt,cdn,imageField, "");
	});
  }