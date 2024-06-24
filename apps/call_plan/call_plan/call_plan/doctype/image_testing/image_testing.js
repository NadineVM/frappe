// Copyright (c) 2024, Nadine Verelia and contributors
// For license information, please see license.txt

frappe.ui.form.on("image testing", {
	refresh(frm) {
		frm.trigger("showpic");
	},

	image1(frm) {
		frm.trigger("showpic");
		frappe.confirm('Are you sure you want to proceed?',
			() => {
				// action to perform if Yes is selected
			}, () => {
				// action to perform if No is selected
			})
	},
	showpic(frm) {
		frm.set_df_property("view_image1", "options", `<img src=${frm.doc.image1} width='200'>`);
	},


});
