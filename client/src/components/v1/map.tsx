type MapProps = {
  rows: number;
  cols: number;
};

const shadeColor = (color: string | undefined, percent: number) => {
  if (!color) {
    return "#A0A0A0";
  }
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  const RR = R.toString(16).padStart(2, "0");
  const GG = G.toString(16).padStart(2, "0");
  const BB = B.toString(16).padStart(2, "0");

  return "#" + RR + GG + BB;
};

const Map = (props: MapProps) => {
  const isoAngle = Math.PI / 6;
  const cos30 = Math.cos(isoAngle);
  const sin30 = Math.sin(isoAngle);

  const cellSize = 40;
  const width = Math.max(props.rows, props.cols) * cellSize * 2 * cos30;
  const height = (props.rows + props.cols) * cellSize * sin30;

  return <div>Map</div>;
};

export default Map;
