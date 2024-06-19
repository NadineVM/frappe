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
			frm.set_df_property("child_doc", "options", `<img src=${row.image1} width='300'>`, frm.docname, "view_image1", row.name);
			frm.set_df_property("child_doc", "options", `<img src=${row.image2} width='300'>`, frm.docname, "view_image2", row.name);
		})
	},
 });
