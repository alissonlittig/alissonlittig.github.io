<section class="hero">
	<div class="wrap hero-grid">
		<div>
			<p class="eyebrow">Curitiba · desde 2014</p>
			<h1>Comida de fogão a lenha, <em>sem pressa</em>.</h1>
			<p class="lead">Receitas de Minas feitas devagar, com ingredientes de pequenos produtores. Almoço, jantar e uma mesa sempre posta para quem chega.</p>
			<p class="cta-row">
				<a class="btn" href="#reservas">Reservar mesa</a>
				<a class="btn btn-ghost-light" href="<?php echo esc_url( get_post_type_archive_link( 'prato' ) ); ?>">Ver cardápio</a>
			</p>
		</div>
		<div class="hero-art" aria-hidden="true">
			<?php echo tacho_art( 7 ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
			<ul class="stats">
				<li><strong>11</strong><span>anos de casa</span></li>
				<li><strong>32</strong><span>lugares</span></li>
				<li><strong>4,8</strong><span>nota média</span></li>
			</ul>
		</div>
	</div>
</section>
