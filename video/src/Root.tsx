import { Fragment } from "react";
import { Composition } from "remotion";

import { ProjectFilm, PROJECT_FILM_DURATION } from "./ProjectFilm";
import { Showreel } from "./Showreel";
import { DesktopLive, desktopLiveMetadata } from "./showcase/DesktopLive";
import { DesktopScroll, desktopMetadata } from "./showcase/DesktopScroll";
import { MobileScroll, mobileMetadata } from "./showcase/MobileScroll";
import { MobileStills } from "./showcase/MobileStills";
import {
  PreviewBackdrop,
  PreviewBrowserFrame,
  PreviewPhoneFrame,
  PreviewSteppedScroll,
  previewSteppedMetadata,
} from "./showcase/Previews";
import { DESKTOP, MOBILE, SCROLL_LAYOUT, STILLS } from "./showcase/data";
import { PROJECTS, routeKey } from "./showcase/projects";

/**
 * Every showcase composition is generated from PROJECTS. Adding a project
 * means adding one config entry (and running the capture).
 */
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Showreel"
        component={Showreel}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProjectFilmAnom"
        component={ProjectFilm}
        durationInFrames={PROJECT_FILM_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {PROJECTS.map((project) => (
        <Fragment key={project.slug}>
          {project.routes.map((route) => {
            const key = routeKey(route);
            const id = `Desktop-${project.slug}-${key}`;
            return route.liveScroll ? (
              <Composition
                key={`${project.slug}-${key}`}
                id={id}
                component={DesktopLive}
                defaultProps={{ slug: project.slug, routeKey: key }}
                durationInFrames={300}
                fps={30}
                width={SCROLL_LAYOUT.width}
                height={SCROLL_LAYOUT.height}
                calculateMetadata={desktopLiveMetadata}
              />
            ) : (
              <Composition
                key={`${project.slug}-${key}`}
                id={id}
                component={DesktopScroll}
                defaultProps={{ slug: project.slug, routeKey: key }}
                durationInFrames={300}
                fps={30}
                width={DESKTOP.width}
                height={DESKTOP.height}
                calculateMetadata={desktopMetadata}
              />
            );
          })}

          <Composition
            id={`Mobile-${project.slug}`}
            component={MobileScroll}
            defaultProps={{ slug: project.slug }}
            durationInFrames={300}
            fps={30}
            width={MOBILE.width}
            height={MOBILE.height}
            calculateMetadata={mobileMetadata}
          />

          <Composition
            id={`Stills-${project.slug}`}
            component={MobileStills}
            defaultProps={{ slug: project.slug }}
            durationInFrames={1}
            fps={30}
            width={STILLS.width}
            height={STILLS.height}
          />
        </Fragment>
      ))}

      <Composition
        id="Preview-Backdrop"
        component={PreviewBackdrop}
        durationInFrames={90}
        fps={30}
        width={DESKTOP.width}
        height={DESKTOP.height}
      />
      <Composition
        id="Preview-BrowserFrame"
        component={PreviewBrowserFrame}
        durationInFrames={90}
        fps={30}
        width={DESKTOP.width}
        height={DESKTOP.height}
      />
      <Composition
        id="Preview-PhoneFrame"
        component={PreviewPhoneFrame}
        durationInFrames={90}
        fps={30}
        width={MOBILE.width}
        height={MOBILE.height}
      />
      <Composition
        id="Preview-SteppedScroll"
        component={PreviewSteppedScroll}
        durationInFrames={300}
        fps={30}
        width={DESKTOP.width}
        height={DESKTOP.height}
        calculateMetadata={previewSteppedMetadata}
      />
    </>
  );
};
