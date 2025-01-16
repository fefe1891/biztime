const db = require('../db');
const request = require("supertest");
const app = require("../app");
const slugify = require("slugify");


describe("GET /companies/:code", () => {
    beforeEach(async function () {
        await db.query("DELETE FROM companies WHERE code ='apple'");
        await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    });
    it('should respond with a single company', async () => {
        const res = await request(app).get('/companies/apple');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('company');
        expect(res.body.company).toHaveProperty('code', 'apple');
        expect(res.body.company).toHaveProperty('name', 'Apple Computer');
        expect(res.body.company).toHaveProperty('description', 'Maker of OSX.');
    }, 10000);
});


describe("POST /companies", () => {
    beforeEach(async function () {
        await db.query("DELETE FROM companies");
    });
    it('should create a new company and respond with the created company', async () => {
        let newCompany = {name: "New Co", description: "A new company.",}

        const res = await request(app).post('/companies').send(newCompany);

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('company');
        expect(res.body.company).toHaveProperty('code', slugify(newCompany.name, {lower: true}));
        expect(res.body.company).toHaveProperty('name', newCompany.name);
        expect(res.body.company).toHaveProperty('description', newCompany.description);
    }, 10000);
});


describe("PUT /companies/:code", () => {
    beforeEach(async function () {
        await db.query("DELETE FROM companies WHERE code ='apple'");
        await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    });
    it("should update an existing company and respond with the updated company", async () => {
        let updatedCompanyDetails= {name: "Updated Co", description: "An updated company."};
        const res = await request(app).put('/companies/apple').send(updatedCompanyDetails);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('company');
        expect(res.body.company).toHaveProperty('code', 'apple');
        expect(res.body.company).toHaveProperty('name', updatedCompanyDetails.name);
        expect(res.body.company).toHaveProperty('description', updatedCompanyDetails.description);
    }, 10000);
});


describe("DELETE /companies/:code - existing company", () => {
    beforeEach(async function () {
        await db.query("DELETE FROM companies WHERE code = 'apple'");
        await db.query("INSERT INTO companies VALUES ('apple', 'Apple Computer', 'Maker of OSX.')");
    });
    afterEach(async function () {
        await db.query("DELETE FROM companies WHERE code = 'apple'")
    });
    it('should delete a single existing company', async () => {
        const res1 = await request(app).delete('/companies/apple');
        expect(res1.statusCode).toBe(200);
        expect(res1.body).toEqual({"status": "deleted"});
    });
});


describe("DELETE /companies/:code - non-existing company", () => {
    it('should respond with a 404 if it cannot find the company in question', async () => {
        const res2 = await request(app).delete('/companies/apple');
        expect(res2.statusCode).toBe(404);
    });
});




afterAll(async () => {
    await db.end();
});
