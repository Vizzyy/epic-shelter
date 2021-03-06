const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../app');
const should = chai.should();
const sinon = require('sinon');
const rp = require('request-promise');
const sandbox = sinon.createSandbox();

chai.use(chaiHttp);
describe('Lights', () => {

    before(function () {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    });

    after(function () {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
        server.close();
    })

    afterEach( function () {
        sandbox.restore();
    });

    describe('GET /lights', () => {
        it('it should get main lights page', (done) => {
            chai.request(server)
                .get('/lights')
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.should.have.status(200);
                    res.text.should.include("<title>Lights</title>");
                    done();
                });
        });
    });
    describe('GET /lights/inside', () => {
        it('it should get /lights/inside page', (done) => {
            chai.request(server)
                .get('/lights/inside')
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.should.have.status(200);
                    res.text.should.include("<h2>Inside Light Strip</h2>");
                    done();
                });
        });
    });
    describe('GET /lights/outside', () => {
        it('it should get /lights/outside page', (done) => {
            chai.request(server)
                .get('/lights/outside')
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.should.have.status(200);
                    res.text.should.include("<h2>Outside Light Strip</h2>");
                    done();
                });
        });
    });
    describe('GET /bedroom/xmas LIGHT OFF', () => {
        it('it should toggle /lights/bedroom/xmas OFF', (done) => {
            sandbox.stub(rp, 'Request').resolves({});
            chai.request(server)
                .post('/lights/bedroom/xmas')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({status: 'false'})
                .end((err, res) => {
                    if(err) { console.log(err); }
                    console.log(res.text);
                    res.req.path.should.eq("/lights/bedroom/xmas")
                    res.should.have.status(200);
                    done();
                });
        });
    });
    describe('GET /bedroom/xmas LIGHT ON', () => {
        it('it should toggle /lights/bedroom/xmas ON', (done) => {
            sandbox.stub(rp, 'Request').resolves({});
            chai.request(server)
                .post('/lights/bedroom/xmas')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({status: 'true'})
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.req.path.should.eq("/lights/bedroom/xmas")
                    res.should.have.status(200);
                    done();
                });
        });
    });
    describe('GET /strip/inside', () => {
        it('it should invoke /strip/inside', (done) => {
            sandbox.stub(rp, 'Request').resolves({});
            chai.request(server)
                .post('/lights/strip/inside')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({status: 'clear'})
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.req.path.should.eq("/lights/strip/inside")
                    res.should.have.status(200);
                    done();
                });
        });
    });
    describe('GET /strip/outside', () => {
        it('it should invoke /strip/outside', (done) => {
            sandbox.stub(rp, 'Request').resolves({});
            chai.request(server)
                .post('/lights/strip/outside')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send({status: 'clear'})
                .end((err, res) => {
                    if(err) { console.log(err); }
                    res.req.path.should.eq("/lights/strip/outside")
                    res.should.have.status(200);
                    done();
                });
        });
    });

});
