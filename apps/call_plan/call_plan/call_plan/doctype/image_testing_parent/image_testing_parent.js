// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

frappe.ui.form.on("image testing parent", {
    refresh(frm) {
		frm.trigger("showpic");
	},
	child_doc(frm) {
		frm.trigger("showpic");
	},
	showpic(frm) {
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
			})
		})
	},
 });
