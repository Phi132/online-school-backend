const express = require('express');
const db = require('../models/index');

let homePage = async (req, res) => {
    try {
        // let data = await db.Account_users.findAll();
        // console.log("++++++++++++++++++++++++++++++++");
        res.render("Home.ejs")
    } catch (e) {
        console.log(e)
    }
}


module.exports = {homePage};
