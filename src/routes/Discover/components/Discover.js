import React, { Component } from "react";
import DiscoverBlock from "./DiscoverBlock/components/DiscoverBlock";
import {
  currentToken,
  getToken,
  redirectToSpotifyAuthorize,
  refreshToken,
  getNewReleases,
  getFeaturedPlaylist,
  getCategories,
} from "../services";
import "../styles/_discover.scss";

export default class Discover extends Component {
  constructor() {
    super();

    this.state = {
      newReleases: [],
      playlists: [],
      categories: [],
    };
  }
  async componentDidMount() {
    // On page load, try to fetch auth code from current browser search URL
    const args = new URLSearchParams(window.location.search);
    const code = args.get("code");

    // If we find a code, we're in a callback, do a token exchange
    if (code) {
      const token = await getToken(code);
      currentToken.save(token);

      // Remove code from URL so we can refresh correctly.
      const url = new URL(window.location.href);
      url.searchParams.delete("code");

      const updatedUrl = url.search ? url.href : url.href.replace("?", "");
      window.history.replaceState({}, document.title, updatedUrl);
    }

    // If we have a token, we're logged in, so fetch newRelease,playlists,categories
    if (currentToken.access_token) {
      getNewReleases().then((res) => {
        this.setState({ newReleases: res.albums.items });
      });
      getFeaturedPlaylist().then((res) => {
        this.setState({ playlists: res.playlists.items });
      });
      getCategories().then((res) => {
        this.setState({ categories: res.categories.items });
      });
    }
    // Otherwise we're not logged in, so redirect to login
    if (!currentToken.access_token) {
      redirectToSpotifyAuthorize();
    }
    // If we have a token, but it's expired, we need to refresh the token
    if (new Date().getTime() >= new Date(currentToken.expires_in).getTime()) {
      refreshToken();
    }
  }

  render() {
    const { newReleases, playlists, categories } = this.state;

    return (
      <div className="discover">
        <DiscoverBlock
          text="RELEASED THIS WEEK"
          id="released"
          data={newReleases}
        />
        <DiscoverBlock
          text="FEATURED PLAYLISTS"
          id="featured"
          data={playlists}
        />
        <DiscoverBlock
          text="BROWSE"
          id="browse"
          data={categories}
          imagesKey="icons"
        />
      </div>
    );
  }
}
