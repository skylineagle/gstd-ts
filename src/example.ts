import { GstdClient } from "./gstd";

const main = async () => {
  const client = new GstdClient({
    url: "https://joy.westeurope.cloudapp.azure.com",
  });
  const pipelineName = "test-stream";

  try {
    // await client.pipelineCreate(
    //   pipelineName,
    //   "videotestsrc is-live=true ! videoconvert ! x264enc tune=zerolatency bitrate=2000 speed-preset=superfast ! rtspclientsink location=rtsp://joy.westeurope.cloudapp.azure.com:8554/mystream"
    // );
    await client.pipelineCreate(
      "test-stream",
      "rtpbin name=rtpbin videotestsrc is-live=true ! videoconvert ! x264enc tune=zerolatency bitrate=512 speed-preset=superfast ! rtph264pay ! rtpbin.send_rtp_sink_0 rtpbin.send_rtp_src_0 ! udpsink host=127.0.0.1 port=5000 async=false rtpbin.send_rtcp_src_0 ! udpsink host=127.0.0.1 port=5001 sync=false async=false udpsrc port=5005 ! rtpbin.recv_rtcp_sink_0"
    );

    const pipelines = await client.listPipelines();
    if (!pipelines.includes(pipelineName)) {
      throw new Error("Pipeline not created");
    }

    console.log("Pipeline created successfully");

    const elements = await client.listElements(pipelineName);

    const h264Element = elements.find((element) => element.includes("x264"));
    if (!h264Element) {
      throw new Error("H264 element not found");
    }
    console.log("H264 element found");

    const h264Properties = await client.listProperties(
      pipelineName,
      h264Element!
    );
    const bitrateProperty = h264Properties.find((property) =>
      property.includes("bitrate")
    );
    if (!bitrateProperty) {
      throw new Error("Bitrate property not found");
    }
    console.log("Bitrate property found");

    // const waitingForMessage = client.waitForMessage(
    //   pipelineName,
    //   "stats",
    //   2000000000
    // );

    await client.pipelinePlay(pipelineName);
    console.log("Pipeline is playing");

    // const busMessages = await waitingForMessage;
    // console.log(JSON.stringify(busMessages, null, 2));

    const value = await client.elementGet(
      pipelineName,
      h264Element!,
      bitrateProperty!
    );
    console.log(`${value.name}: ${value.value}`);

    const newBitrate = prompt("Enter a new bitrate value: ");
    console.log(`User entered: ${newBitrate}`);

    await client.elementSet(
      pipelineName,
      h264Element!,
      bitrateProperty!,
      newBitrate
    );
    console.log(`Bitrate set to ${newBitrate}`);

    const newValue = await client.elementGet(
      pipelineName,
      h264Element!,
      bitrateProperty!
    );
    console.log(`${newValue.name}: ${newValue.value}`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    await client.pipelinePause(pipelineName);
    console.log("Pipeline paused");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await client.pipelineStop(pipelineName);
    console.log("Pipeline stopped");
  } catch (error) {
    console.error("Error:", error);
    try {
      await client.pipelineDelete(pipelineName);
    } catch {
      console.error("Failed to cleanup pipeline");
    }
  } finally {
    await client.pipelineDelete(pipelineName);
    console.log("Pipeline deleted");
  }
};

main().catch(console.error);
