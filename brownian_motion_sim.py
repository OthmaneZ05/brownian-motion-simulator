from dataclasses import dataclass
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns


@dataclass(frozen=True)
class SimulationConfig:
    points: int = 1000
    paths: int = 50
    interval_start: float = 0.0
    interval_end: float = 1.0
    seed: int = 42
    output_dir: Path = Path("figures")


def build_time_axis(config: SimulationConfig) -> tuple[np.ndarray, float]:
    time_axis = np.linspace(config.interval_start, config.interval_end, config.points)
    dt = (config.interval_end - config.interval_start) / (config.points - 1)
    return time_axis, dt


def sample_noise(config: SimulationConfig, mean: float = 0.0, std: float = 1.0) -> np.ndarray:
    rng = np.random.default_rng(config.seed)
    return rng.normal(mean, std, (config.paths, config.points))


def simulate_standard_brownian_motion(
    noise: np.ndarray,
    dt: float,
) -> np.ndarray:
    increments = np.sqrt(dt) * noise[:, :-1]
    paths = np.zeros((noise.shape[0], noise.shape[1]))
    paths[:, 1:] = np.cumsum(increments, axis=1)
    return paths


def simulate_brownian_motion_with_drift(
    noise: np.ndarray,
    dt: float,
    drift: float,
    diffusion: float,
) -> np.ndarray:
    increments = drift * dt + diffusion * np.sqrt(dt) * noise[:, :-1]
    paths = np.zeros((noise.shape[0], noise.shape[1]))
    paths[:, 1:] = np.cumsum(increments, axis=1)
    return paths


def plot_paths(
    time_axis: np.ndarray,
    simulated_paths: np.ndarray,
    title: str,
    y_label: str,
    output_path: Path,
) -> None:
    fig, ax = plt.subplots(figsize=(12, 8))
    for path in simulated_paths:
        ax.plot(time_axis, path)

    ax.set_title(title)
    ax.set_xlabel("Time")
    ax.set_ylabel(y_label)
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def plot_terminal_distribution(final_values: np.ndarray, output_path: Path) -> None:
    final_values_frame = pd.DataFrame({"final_values": final_values})

    fig, ax = plt.subplots(figsize=(12, 8))
    sns.kdeplot(data=final_values_frame, x="final_values", fill=True, ax=ax)
    ax.set_title("Kernel Density Estimate of Terminal Value Distribution")
    ax.set_xlabel("Terminal Value")
    ax.set_ylim(0.0, 0.325)
    fig.tight_layout()
    fig.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def main() -> None:
    config = SimulationConfig()
    time_axis, dt = build_time_axis(config)
    noise = sample_noise(config)
    config.output_dir.mkdir(parents=True, exist_ok=True)

    standard_paths = simulate_standard_brownian_motion(noise, dt)
    plot_paths(
        time_axis=time_axis,
        simulated_paths=standard_paths,
        title="Standard Brownian Motion Sample Paths",
        y_label="Value",
        output_path=config.output_dir / "standard_brownian_motion_paths.png",
    )
    plot_terminal_distribution(
        standard_paths[:, -1],
        output_path=config.output_dir / "standard_brownian_motion_terminal_distribution.png",
    )

    drift_paths = simulate_brownian_motion_with_drift(
        noise=noise,
        dt=dt,
        drift=5.0,
        diffusion=2.0,
    )
    plot_paths(
        time_axis=time_axis,
        simulated_paths=drift_paths,
        title="Brownian Motion with Drift Sample Paths",
        y_label="Value",
        output_path=config.output_dir / "brownian_motion_with_drift_paths.png",
    )


if __name__ == "__main__":
    main()
