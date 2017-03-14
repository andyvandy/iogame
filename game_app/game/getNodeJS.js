module.exports = {
  get: function (buf) {
    function Reader (buf) {
      this.index = 0
      this.buffer = buf
    }
    Reader.prototype.readString8 = function () {
      var data = ''
      while (this.index <= this.buffer.length) {
        var d = this.readUInt8()
        if (!d) break
        data += String.fromCharCode(d)
      }
      return data
    }
    Reader.prototype.readString16 = function () {
      var data = ''
      while (this.index <= this.buffer.length) {
        var d = this.readUInt16BE()
        if (!d) break
        data += String.fromCharCode(d)
      }
      return data
    }
    Reader.prototype.readString32 = function () {
      var data = ''
      while (this.index <= this.buffer.length) {
        var d = this.readUInt32BE()
        if (!d) break
        data += String.fromCharCode(d)
      }
      return data
    }
    Reader.prototype.readUInt8 = function () {
      return this.buffer.readUInt8(this.index++)
    }
    Reader.prototype.readUInt16BE = function () {
      var data = this.buffer.readUInt16BE(this.index)
      this.index += 2
      return data
    }
    Reader.prototype.readUInt32BE = function () {
      var data = this.buffer.readUInt32BE(this.index)
      this.index += 4
      return data
    }

    var reader = new Reader(buf)

    var data1 = []
    for (var i1 = 0; i1 < 4; i1++) {
      data1.push(reader.readUInt8())
    }
    return data1
  }
}