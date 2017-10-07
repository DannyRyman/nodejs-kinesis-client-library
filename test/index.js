var assert = require('assert')
var child_process = require('child_process')
var path = require('path')

var async = require('async')
var AWS = require('aws-sdk')

var helpers = require('./helpers')

describe('Kinesis Client Library', function () {
  var kinesis = new AWS.Kinesis({
    region: helpers.kinesalite.region,
    accessKeyId: helpers.kinesalite.accessKeyId,
    secretAccessKey: helpers.kinesalite.secretAccessKey
  })

  kinesis.setEndpoint('http://localhost:' + helpers.kinesalite.port)
  var kinesaliteProc

  before(function (done) {
    async.series([
      function (cb) {
        helpers.kinesalite.start(function (err, proc) {
          if (err) return cb(err)
          kinesaliteProc = proc
          cb()
        })
      },

      function (cb) {
        helpers.kinesalite.createStream(cb)
      },

      function (cb) {
        var records = helpers.fixtures.records.map(function (record) {
          return {
            Data: record,
            PartitionKey: record
          }
        })

        kinesis.putRecords({
          Records: records,
          StreamName: helpers.kinesalite.name
        }, cb)
      }
    ], done)
  })

  after(function () {
    if (kinesaliteProc) kinesaliteProc.kill()
  })


  it('Should read all records', function (done) {
    this.timeout(60000)

    var stdout = ''
    var proc = helpers.consumer.launch('print')
    proc.stdout.on('data', function (chunk) {
      stdout += chunk
    })

    function getCurrentlyReadLyricsLength () {
      var lyrics = stdout.match(/Line: /g)
      return lyrics ? lyrics.length : 0
    }

    let lyricsLength = 0
    helpers.poll(() => {
      lyricsLength = getCurrentlyReadLyricsLength()
      return lyricsLength === helpers.fixtures.records.length
    }, 30000, 100)
      .then(() => {
        assert.equal(lyricsLength, helpers.fixtures.records.length, 'Write one line per lyric')
        done()
      })
      .catch(() => done('Timed out waiting for lyrics to be read.'))
  })
})
