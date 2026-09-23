import AVFoundation
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

/// Writes native-resolution WebP frames from a turntable clip.
/// Usage: swift scripts/extract-turntable.swift <input.mp4> <output-dir>
let args = CommandLine.arguments
guard args.count == 3 else {
  fputs("usage: swift scripts/extract-turntable.swift <input.mp4> <output-dir>\n", stderr)
  exit(1)
}

let input = URL(fileURLWithPath: args[1])
let outputDir = URL(fileURLWithPath: args[2], isDirectory: true)
let fps: Double = 24
let cwebp = "/usr/local/bin/cwebp"
let webpQuality = "90"

let asset = AVURLAsset(url: input)
let duration = CMTimeGetSeconds(asset.duration)
guard duration.isFinite, duration > 0 else {
  fputs("could not read duration for \(input.path)\n", stderr)
  exit(1)
}

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let count = Int((duration * fps).rounded(.towardZero))
guard count > 0 else {
  fputs("no frames in \(input.path)\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(at: outputDir, withIntermediateDirectories: true)

var plateWidth = 0
var plateHeight = 0

for i in 0..<count {
  let seconds = Double(i) / fps
  let time = CMTime(seconds: seconds, preferredTimescale: 600)
  let image = try generator.copyCGImage(at: time, actualTime: nil)
  if i == 0 {
    plateWidth = image.width
    plateHeight = image.height
  }

  let name = String(format: "%03d.webp", i)
  let webpURL = outputDir.appendingPathComponent(name)
  let pngURL = outputDir.appendingPathComponent("frame.png")
  guard let dest = CGImageDestinationCreateWithURL(pngURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    fputs("could not create png for \(name)\n", stderr)
    exit(1)
  }
  CGImageDestinationAddImage(dest, image, nil)
  guard CGImageDestinationFinalize(dest) else {
    fputs("could not write png for \(name)\n", stderr)
    exit(1)
  }

  let encoder = Process()
  encoder.executableURL = URL(fileURLWithPath: cwebp)
  encoder.arguments = ["-quiet", "-q", webpQuality, pngURL.path, "-o", webpURL.path]
  try encoder.run()
  encoder.waitUntilExit()
  try? FileManager.default.removeItem(at: pngURL)
  guard encoder.terminationStatus == 0 else {
    fputs("cwebp failed on \(name)\n", stderr)
    exit(1)
  }
  if i % 24 == 0 || i == count - 1 {
    print("frame \(i + 1)/\(count)")
  }
}

print("frames \(count)")
print("size \(plateWidth)x\(plateHeight)")
